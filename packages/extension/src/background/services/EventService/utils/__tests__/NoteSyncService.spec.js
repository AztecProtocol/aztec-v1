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
import Web3Service from '~background/services/Web3Service';
import NoteSyncService from '../../';
import SyncManager from '../../helpers/SyncManager';
import asyncMap from '~utils/asyncMap';
import fetchNotes from '../fetchNotes';
import decodeNoteLogs from '../helpers/decodeNoteLogs';
import associatedNotesWithOwner from '../helpers/associatedNotesWithOwner';
import saveNotes from '../saveNotes';
import {
    IZkAssetConfig,
} from '~background/config/contracts';


jest.setTimeout(500000000);

const { JOIN_SPLIT_PROOF } = devUtils.proofs;
const {
    note,
    JoinSplitProof,
    ProofUtils,
} = aztec;

describe('ZkAsset', () => {
    const providerUrl = `http://localhost:8545`;
    const prepopulateEventsCount = 340;
    const epoch = 1;
    const category = 1;
    const proofId = 1;
    const filter = 17;
    const scalingFactor = 1;
    const depositAmount = prepopulateEventsCount * 2;
    let erc20Address;
    let zkAssetAddress;
    let notes;
    let depositProof;
    let sender;
    let syncManager;

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

        const { createNotes, destroyNotes, updateNotes } = await fetchNotes({
            fromBlock: 1,
            toBlock: 'latest',
            onError: () => {},
        });

        const eventsInGanache = createNotes.length + destroyNotes.length + updateNotes.length;
        console.log(`Already eventsInGanache: ${eventsInGanache}`);
        if (eventsInGanache >= prepopulateEventsCount) return;

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

        
        ({
            address: erc20Address,
        } = await Web3Service.deploy(ERC20Mintable));

        let notesPerRequest = 20;
        let createdNotes = eventsInGanache;
        
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

            // notes with 1 balances
            const noteValues = new Array(notesPerRequest);
            noteValues.fill(1);

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

    beforeEach(async() => {
        syncManager = new SyncManager();
        syncManager.setConfig({
            blocksPerRequest: 99999999999,
        });
    });


    it(`check how does it take to fetch ${prepopulateEventsCount} events, filter by owner and store into faked db`, async () => {
        // given
        const { abi, getPastLogs } = Web3Service.eth;

        const eventsTopics = [
            IZkAssetConfig.events.createNote,
            IZkAssetConfig.events.destroyNote,
            IZkAssetConfig.events.updateNoteMetaData,
        ]
            .map(e => IZkAssetConfig.config.abi.find(({name, type})=> name === e && type === 'event'))
            .map(abi.encodeEventSignature);

        const options = {"fromBlock":1,"toBlock":"latest","topics":[["0x5ffb3072e4515cf3bfae8b16be9dff6313cf7c313a0c26faafe6971d8c7585f1","0xebd4bb7b61198df63305dd538f077db9df9b14339d8a6221e301487770d79227","0xda392cb8aa0843e7e474e7bacfae355313fc4202094b3e81d2a488b5c05207bf"]]};

        // action
        const tStart = performance.now();
        let t0 = tStart;
        let t1;
        const rawLogs = await getPastLogs(options);
        t1 = performance.now();
        console.log(`Load past logs ${rawLogs.length} took: ${((t1 - t0) / 1000)} seconds.`);

        t0 = performance.now();
        const decodedLogs = decodeNoteLogs(eventsTopics, rawLogs);
        t1 = performance.now();
        console.log(`Decode raw logs took: ${((t1 - t0) / 1000)} seconds.`)
        
        t0 = performance.now();
        const notes = associatedNotesWithOwner(decodedLogs, sender.address);
        t1 = performance.now();
        console.log(`Filtering logs took: ${((t1 - t0) / 1000)} seconds.`)

        t0 = performance.now();
        await saveNotes(notes);
        t1 = performance.now();
        console.log(`Saving logs into fake db took: ${((t1 - t0) / 1000)} seconds.`)

        const tEnd = performance.now();

        // result
        console.log(`Full amount of time: ${((tEnd - tStart) / 1000)} seconds.`)
    });

});
