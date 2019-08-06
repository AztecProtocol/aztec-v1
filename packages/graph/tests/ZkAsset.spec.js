import devUtils from '@aztec/dev-utils';
import bn128 from '@aztec/bn128';
import aztec from 'aztec.js';
/* eslint-disable import/no-unresolved */
import ACE from '../build/contracts/ACE';
import ERC20Mintable from '../build/contracts/ERC20Mintable';
import ZkAssetOwnable from '../build/contracts/ZkAssetOwnable';
import JoinSplit from '../build/contracts/JoinSplit';
/* eslint-enable */
import Web3Service from './helpers/Web3Service';
import Web3Events from './helpers/Web3Events';
import Query from './helpers/Query';
import asyncMap from './utils/asyncMap';
import generateRandomId from './utils/generateRandomId';

jest.setTimeout(50000);

const { JOIN_SPLIT_PROOF } = devUtils.proofs;
const {
    note,
    encoder,
    JoinSplitProof,
    ProofUtils,
} = aztec;
const {
    outputCoder,
} = encoder;

const METADATA_AZTEC_DATA_LENGTH = 194;
const METADATA_VAR_LEN_LENGTH = 32;
const METADATA_ADDRESS_LENGTH = 40;
const METADATA_VIEWING_KEY_LENGTH = 420;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('ZkAsset', () => {
    const epoch = 1;
    const category = 1;
    const proofId = 1;
    const filter = 17;
    const scalingFactor = 1;
    const depositAmount = 10;
    let erc20Address;
    let zkAssetAddress;
    let notes;
    let depositProof;
    let sender;

    const generateNotes = async noteValues =>
        // throw an error from web3-providers
        // "Connection refused or URL couldn't be resolved: http://localhost:8545"
        // if create notes ascyncronously and then call .send or .call on contracts
        asyncMap(noteValues, async (val) => { // eslint-disable-line implicit-arrow-linebreak
            const {
                publicKey,
            } = sender;
            return note.create(publicKey, val);
        });

    const getNoteInfoFromDepositProof = (noteIndex) => {
        const {
            noteHash,
        } = notes[noteIndex].exportNote();
        const outputNotes = outputCoder.getOutputNotes(depositProof.output);
        const outputNote = outputCoder.getNote(outputNotes, noteIndex);
        const metadata = outputCoder.getMetadata(outputNote);

        return {
            noteHash,
            metadata: metadata.startsWith('0x')
                ? metadata
                : `0x${metadata}`,
        };
    };

    beforeAll(async () => {
        Web3Service.init();
        Web3Service.registerContract(ACE);

        sender = Web3Service.account;

        await Web3Service
            .useContract('ACE')
            .method('setCommonReferenceString')
            .send(bn128.CRS);

        const existingProof = await Web3Service
            .useContract('ACE')
            .method('validators')
            .call(
                epoch,
                category,
                proofId,
            );

        if (!existingProof) {
            Web3Service.registerContract(JoinSplit);
            const joinSplitAddress = Web3Service.contract('JoinSplit').address;
            await Web3Service
                .useContract('ACE')
                .method('setProof')
                .send(
                    JOIN_SPLIT_PROOF,
                    joinSplitAddress,
                );
        }
    });

    beforeEach(async () => {
        ({
            address: erc20Address,
        } = await Web3Service.deploy(ERC20Mintable));

        await Web3Service
            .useContract('ERC20Mintable')
            .at(erc20Address)
            .method('mint')
            .send(
                sender.address,
                depositAmount,
            );

        const aceAddress = Web3Service.contract('ACE').address;

        await Web3Service
            .useContract('ERC20Mintable')
            .at(erc20Address)
            .method('approve')
            .send(
                aceAddress,
                depositAmount,
            );

        const {
            address: zkAssetContractAddress,
        } = await Web3Service.deploy(ZkAssetOwnable, [
            aceAddress,
            erc20Address,
            scalingFactor,
        ]);
        zkAssetAddress = zkAssetContractAddress.toLowerCase();

        await Web3Service
            .useContract('ZkAssetOwnable')
            .at(zkAssetAddress)
            .method('setProofs')
            .send(
                epoch,
                filter,
            );

        const inputNotes = [];
        const depositInputOwnerAccounts = [];
        const noteValues = [
            0,
            depositAmount,
        ];
        notes = await generateNotes(noteValues);
        const publicValue = ProofUtils.getPublicValue(
            [],
            noteValues,
        );

        await sleep(1000);

        depositProof = new JoinSplitProof(
            inputNotes,
            notes,
            sender.address,
            publicValue,
            sender.address,
        );

        await Web3Service
            .useContract('ACE')
            .method('publicApprove')
            .send(
                zkAssetAddress,
                depositProof.hash,
                depositAmount,
            );

        const depositData = depositProof.encodeABI(zkAssetAddress);
        const depositSignatures = depositProof.constructSignatures(
            zkAssetAddress,
            depositInputOwnerAccounts,
        );

        await Web3Service
            .useContract('ZkAssetOwnable')
            .at(zkAssetAddress)
            .method('confidentialTransfer')
            .send(
                depositData,
                depositSignatures,
            );
    });

    it('create Note entity from CreateNote event', async () => {
        const pastEvents = await Web3Service
            .useContract('ZkAssetOwnable')
            .at(zkAssetAddress)
            .events('CreateNote')
            .where({
                id: sender.address,
            });

        const {
            noteHash: noteHash0,
            metadata: metadata0,
        } = getNoteInfoFromDepositProof(0);
        const {
            noteHash: noteHash1,
            metadata: metadata1,
        } = getNoteInfoFromDepositProof(1);

        Web3Events(pastEvents)
            .event('CreateNote')
            .toHaveBeenCalledTimes(2)
            .toHaveBeenCalledWith([
                {
                    noteHash: noteHash0,
                    metadata: metadata0,
                },
                {
                    noteHash: noteHash1,
                    metadata: metadata1,
                },
            ]);

        const query = `
            query($where: Note_filter) {
                notes(first: 2, where: $where) {
                    id
                }
            }
        `;

        const data = await Query({
            query,
            variables: {
                where: {
                    id_in: [
                        noteHash0,
                        noteHash1,
                    ],
                },
            },
        });
        expect(data.notes.sort((a, b) => a.id > b.id)).toEqual([
            {
                id: noteHash0,
            },
            {
                id: noteHash1,
            },
        ].sort((a, b) => a.id > b.id));
    });

    it('create NoteAccess entities from UpdateNoteMetadata event', async () => {
        const {
            noteHash,
            metadata,
        } = getNoteInfoFromDepositProof(0);

        expect(metadata.length).toBe(2 + METADATA_AZTEC_DATA_LENGTH);

        const viewingKey = generateRandomId(METADATA_VIEWING_KEY_LENGTH);

        const newMetadata = [
            metadata,
            `${METADATA_ADDRESS_LENGTH.toString(16)}`.padStart(METADATA_VAR_LEN_LENGTH, '0'),
            `${METADATA_VIEWING_KEY_LENGTH.toString(16)}`.padStart(METADATA_VAR_LEN_LENGTH, '0'),
            ''.padStart(METADATA_VAR_LEN_LENGTH, '0'),
            sender.address.slice(2),
            viewingKey,
        ].join('').toLowerCase();

        expect(newMetadata.length).toBe(
            2
            + METADATA_AZTEC_DATA_LENGTH
            + (METADATA_VAR_LEN_LENGTH * 3)
            + METADATA_ADDRESS_LENGTH
            + METADATA_VIEWING_KEY_LENGTH,
        );

        await Web3Service
            .useContract('ZkAssetOwnable')
            .at(zkAssetAddress)
            .method('updateNoteMetaData')
            .send(
                noteHash,
                newMetadata,
            );

        const pastEvents = await Web3Service
            .useContract('ZkAssetOwnable')
            .at(zkAssetAddress)
            .events()
            .all();

        Web3Events(pastEvents)
            .event('UpdateNoteMetadata')
            .toHaveBeenCalledTimes(1)
            .toHaveBeenCalledWith({
                noteHash,
                metadata: newMetadata,
            });

        const query = `
            query(
                $noteHash: ID,
                $noteAccessWhere: NoteAccess_filter,
            ) {
                note(id: $noteHash) {
                    id
                    metadata
                }
                noteAccesses(first: 1, where: $noteAccessWhere) {
                    note {
                        id
                    }
                    account {
                        address
                    }
                    viewingKey
                }
            }
        `;
        const data = await Query({
            query,
            variables: {
                noteHash,
                noteAccessWhere: {
                    note: noteHash,
                },
            },
        });
        expect(data).toEqual({
            note: {
                id: noteHash,
                metadata: newMetadata,
            },
            noteAccesses: [
                {
                    note: {
                        id: noteHash,
                    },
                    account: {
                        address: sender.address.toLowerCase(),
                    },
                    viewingKey: `0x${viewingKey}`,
                },
            ],
        });
    });
});
