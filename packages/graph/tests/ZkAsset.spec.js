/* global jest, expect, beforeAll */
import dotenv from 'dotenv';
import devUtils from '@aztec/dev-utils';
import secp256k1 from '@aztec/secp256k1';
import aztec from 'aztec.js';
import ACE from '../build/contracts/ACE';
import ERC20Mintable from '../build/contracts/ERC20Mintable';
import ZkAssetOwnable from '../build/contracts/ZkAssetOwnable';
import JoinSplit from '../build/contracts/JoinSplit';
import Web3Service from './helpers/Web3Service';
import Web3Events from './helpers/Web3Events';
import Query from './helpers/Query';
import asyncMap from './utils/asyncMap';
import generateRandomId from './utils/generateRandomId';

dotenv.config();
jest.setTimeout(50000);

const { constants } = devUtils;
const { JOIN_SPLIT_PROOF } = devUtils.proofs;
const {
    note,
    proof,
    abiEncoder,
} = aztec;
const {
    outputCoder,
} = abiEncoder;

const ADDRESS_LENGTH = 42;
const METADATA_AZTEC_DATA_LENGTH = 194;
const METADATA_VAR_LEN_LENGTH = 32;
const METADATA_ADDRESS_LENGTH = ADDRESS_LENGTH - 2;
const METADATA_VIEWING_KEY_LENGTH = 6;

describe('ZkAsset', () => {
    const epoch = 1;
    const category = 1;
    const proofId = 1;
    const filter = 17;
    const scalingFactor = 1;
    const canAdjustSupply = true;
    const canConvert = true;
    const depositAmount = 10;
    let erc20Address;
    let zkAssetAddress;
    let notes;
    let depositProof;
    let depositProofOutput;
    let depositProofHash;

    const sender = secp256k1.accountFromPrivateKey(process.env.GANACHE_TESTING_ACCOUNT_0);
    sender.address = sender.address.toLowerCase();

    const generateNotes = async (noteValues) =>
        // throw an error from web3-providers
        // "Connection refused or URL couldn't be resolved: http://localhost:8545"
        // if create notes ascyncronously and then call .send or .call on contracts
        asyncMap(noteValues, async (val) => {
            const {
                publicKey,
            } = sender;
            return note.create(publicKey, val);
        });

    const getNoteInfoFromDepositProof = (noteIndex) => {
        const {
            noteHash,
        } = notes[noteIndex].exportNote();
        const outputNotes = outputCoder.getOutputNotes(depositProofOutput);
        const outputNote = outputCoder.getNote(outputNotes, noteIndex);
        const metadata = outputCoder.getMetadata(outputNote);

        return {
            noteHash,
            metadata: metadata.startsWith('0x')
                ? metadata
                : `0x${metadata}`,
        }
    };

    beforeAll(async () => {
        Web3Service.init();
        Web3Service.registerContract(ACE);
        Web3Service.registerInterface(ERC20Mintable);
        Web3Service.registerInterface(ZkAssetOwnable);

        await Web3Service
            .useContract('ACE')
            .method('setCommonReferenceString')
            .send(constants.CRS);

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
        const {
            contractAddress: erc20ContractAddress,
        } = await Web3Service.deploy(ERC20Mintable);
        erc20Address = erc20ContractAddress;

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
            contractAddress: zkAssetContractAddress,
        } = await Web3Service.deploy(ZkAssetOwnable, [
            aceAddress,
            erc20Address,
            scalingFactor,
            canAdjustSupply,
            canConvert,
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

        notes = await generateNotes([
            0,
            depositAmount,
        ]);

        depositProof = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: [],
            outputNotes: notes,
            senderAddress: sender.address,
            inputNoteOwners: [],
            publicOwner: sender.address,
            kPublic: -(depositAmount),
            validatorAddress: zkAssetAddress,
        });
        depositProofOutput = outputCoder.getProofOutput(depositProof.expectedOutput, 0);
        depositProofHash = outputCoder.hashProofOutput(depositProofOutput);

        await Web3Service
            .useContract('ACE')
            .method('publicApprove')
            .send(
                zkAssetAddress,
                depositProofHash,
                depositAmount,
            );

        await Web3Service
            .useContract('ZkAssetOwnable')
            .at(zkAssetAddress)
            .method('confidentialTransfer')
            .send(
                depositProof.proofData,
                depositProof.signatures,
            );
    });

    it('create Note entity from CreateNote event', async () => {
        const accounts = await Web3Service.getAccounts();
        expect(accounts[0].toLowerCase()).toBe(sender.address);

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
        expect(data).toEqual({
            notes: [
                {
                    id: noteHash0,
                },
                {
                    id: noteHash1,
                },
            ],
        });
    });

    it('create NoteAccess entities from UpdateNoteMetaData event', async () => {
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
            '0'.padStart(METADATA_VAR_LEN_LENGTH, '0'),
            sender.address.slice(2),
            viewingKey,
        ].join('').toLowerCase();

        expect(newMetadata.length).toBe(
            2
            + METADATA_AZTEC_DATA_LENGTH
            + (METADATA_VAR_LEN_LENGTH * 3)
            + METADATA_ADDRESS_LENGTH
            + METADATA_VIEWING_KEY_LENGTH
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
            .events('UpdateNoteMetaData')
            .where({
                id: noteHash,
            });

        Web3Events(pastEvents)
            .event('UpdateNoteMetaData')
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
                        address: sender.address,
                    },
                    viewingKey: `0x${viewingKey}`,
                },
            ],
        });
    });
});
