import devUtils from '@aztec/dev-utils';
import bn128 from '@aztec/bn128';
import aztec from 'aztec.js';
import Web3 from 'web3';
import AuthService from './helpers/AuthService';
/* eslint-disable import/no-unresolved */
import ACE from '../../../../../contracts/ACE';
import ERC20Mintable from '../../../../../contracts/ERC20Mintable';
import ZkAssetOwnable from '../../../../../contracts/ZkAssetOwnable';
import JoinSplit from '../../../../../contracts/JoinSplit';
/* eslint-enable */
import Web3Service from '../../../../Web3Service';
import NoteSyncService from '../../';
import asyncMap from '~utils/asyncMap';


jest.setTimeout(50000000);

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

// const METADATA_AZTEC_DATA_LENGTH = 194;
// const METADATA_VAR_LEN_LENGTH = 32;
// const METADATA_ADDRESS_LENGTH = 40;
// const METADATA_VIEWING_KEY_LENGTH = 420;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

describe('ZkAsset', () => {
    const providerUrl = `http://localhost:8545`;
    const prepopulateEventsCount = 1000;
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


    beforeAll(async () => {
        const provider = new Web3.providers.HttpProvider(providerUrl);
        Web3Service.init({provider, account: AuthService.getAccount()});
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

        let notesPerRequest = 20;
        let createdNotes = 0;
        
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

        do {
            const inputNotes = [];
            const depositInputOwnerAccounts = [];

            // notes with 0 balances
            const noteValues = new Array(notesPerRequest);
            noteValues.fill(0);

            notes = await generateNotes(noteValues);
            const publicValue = ProofUtils.getPublicValue(
                [],
                noteValues,
            );

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

            createdNotes += (notesPerRequest + 1);

            console.log(`Progress prepopulation: ${parseInt(createdNotes * 100 / prepopulateEventsCount)} %`)

        } while (createdNotes < prepopulateEventsCount);
    
    });

    it('create Note entity from CreateNote event', async () => {
        // const pastEvents = await Web3Service
        //     .useContract('ZkAssetOwnable')
        //     .at(zkAssetAddress)
        //     .events(['CreateNote', 'UpateNote'])
        //     .where({
        //         id: sender.address,
        //     });
        
        // console.log(`Past events count: ${pastEvents.length}`);

        console.log("------------------" * 5);

        // await NoteSyncService.syncEthAddress({
        //     address: sender.address,
        // })
    });

});
