import devUtils from '@aztec/dev-utils';
import bn128 from '@aztec/bn128';
import aztec from 'aztec.js';
import AuthService from './helpers/AuthService';

import ERC20Mintable from '../../../../../../build/contracts/ERC20Mintable';
import ZkAssetOwnable from '../../../../../../build/contracts/ZkAssetOwnable';
import JoinSplit from '../../../../../../build/contracts/JoinSplit';

import Web3Service from '~helpers/NetworkService';
import asyncMap from '~utils/asyncMap';
import fetchNotes from '../fetchNotes';
import decodeNoteLogs from '../note/helpers/decodeNoteLogs';
import associatedNotesWithOwner from '../note/helpers/associatedNotesWithOwner';
import saveNotes from '../saveNotes';
import {
    IZkAssetConfig,
    AZTECAccountRegistryConfig,
    ACEConfig,
} from '~/config/contracts';
import NetworkService from '~helpers/NetworkService/factory';
import {
    errorLog,
    log,
} from '~utils/log';


jest.setTimeout(500000000);

const { JOIN_SPLIT_PROOF } = devUtils.proofs;
const {
    note,
    JoinSplitProof,
    ProofUtils,
} = aztec;

describe('ZkAsset', () => {
    const networkId = 0;
    const providerUrl = 'ws://localhost:8545';
    const prepopulateEventsCount = 100;
    const epoch = 1;
    const category = 1;
    const proofId = 1;
    const filter = 17;
    const scalingFactor = 1;
    const depositAmount = prepopulateEventsCount * 2;
    const sender = AuthService.getAccount();

    let erc20Address;
    let zkAssetAddress;
    let notes;
    let depositProof;
    let syncManager;
    let web3Service;

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

    const configureWeb3Service = async () => {
        const contractsConfigs = [
            AZTECAccountRegistryConfig.config,
            ACEConfig.config,
        ];

        const ganacheNetworkConfig = {
            title: 'Ganache',
            networkId: 0,
            providerUrl,
            contractsConfigs,
        };

        NetworkService.setConfigs([
            ...[ganacheNetworkConfig],
        ]);
    };

    beforeAll(async () => {
        configureWeb3Service();
        web3Service = Web3Service(sender);

        const {
            error,
            groupedNotes,
        } = await fetchNotes({
            fromBlock: 1,
            toBlock: 'latest',
            networkId,
        });

        if (error) {
            errorLog('Cannot fetch all notes', error);
        }

        const eventsInGanache = groupedNotes.allNotes();
        log(`Already eventsInGanache: ${eventsInGanache.length}`);
        if (eventsInGanache.length >= prepopulateEventsCount) return;

        await web3Service
            .useContract('ACE')
            .method('setCommonReferenceString')
            .send(bn128.CRS);

        const existingProof = await web3Service
            .useContract('ACE')
            .method('validators')
            .call(
                epoch,
                category,
                proofId,
            );

        if (!existingProof) {
            web3Service.registerContract(JoinSplit);
            const joinSplitAddress = web3Service.contract('JoinSplit').address;
            await web3Service
                .useContract('ACE')
                .method('setProof')
                .send(
                    JOIN_SPLIT_PROOF,
                    joinSplitAddress,
                );
        }


        ({
            address: erc20Address,
        } = await web3Service.deploy(ERC20Mintable));

        const notesPerRequest = 2;
        const createdNotes = eventsInGanache;

        await web3Service
            .useContract('ERC20Mintable')
            .at(erc20Address)
            .method('mint')
            .send(
                sender.address,
                depositAmount,
            );

        const aceAddress = web3Service.contract('ACE').address;

        await web3Service
            .useContract('ERC20Mintable')
            .at(erc20Address)
            .method('approve')
            .send(
                aceAddress,
                depositAmount,
            );

        const {
            address: zkAssetContractAddress,
        } = await web3Service.deploy(ZkAssetOwnable, [
            aceAddress,
            erc20Address,
            scalingFactor,
        ]);
        zkAssetAddress = zkAssetContractAddress;

        // await web3Service
        //     .useContract('ZkAssetOwnable')
        //     .at(zkAssetAddress)
        //     .method('setProofs')
        //     .send(
        //         epoch,
        //         filter,
        //     );

        // do {
        //     const inputNotes = [];
        //     const depositInputOwnerAccounts = [];

        //     // notes with 1 balances
        //     const noteValues = new Array(notesPerRequest);
        //     noteValues.fill(1);

        //     // eslint-disable-next-line no-await-in-loop
        //     notes = await generateNotes(noteValues);
        //     const publicValue = ProofUtils.getPublicValue(
        //         [],
        //         noteValues,
        //     );

        //     depositProof = new JoinSplitProof(
        //         inputNotes,
        //         notes,
        //         sender.address,
        //         publicValue,
        //         sender.address,
        //     );

        //     // eslint-disable-next-line no-await-in-loop
        //     await web3Service
        //         .useContract('ACE')
        //         .method('publicApprove')
        //         .send(
        //             zkAssetAddress,
        //             depositProof.hash,
        //             depositAmount,
        //         );

        //     const depositData = depositProof.encodeABI(zkAssetAddress);
        //     const depositSignatures = depositProof.constructSignatures(
        //         zkAssetAddress,
        //         depositInputOwnerAccounts,
        //     );

        //     // eslint-disable-next-line no-await-in-loop
        //     await web3Service
        //         .useContract('ZkAssetOwnable')
        //         .at(zkAssetAddress)
        //         .method('confidentialTransfer')
        //         .send(
        //             depositData,
        //             depositSignatures,
        //         );

        //     createdNotes += (notesPerRequest + 1);

        //     log(`Progress prepopulation: ${parseInt(createdNotes * 100 / prepopulateEventsCount)} %`);
        // } while (createdNotes < prepopulateEventsCount);
    });

    beforeEach(async () => {
        // syncManager = new SyncManager();
        // syncManager.setConfig({
        //     blocksPerRequest: 99999999999,
        // });
    });

    it('empty test', () => {

    });

    it.skip(`check how does it take to fetch ${prepopulateEventsCount} events, filter by owner and store into faked db`, async () => {
        // given
        const { abi, getPastLogs } = web3Service.eth;

        const eventsTopics = [
            IZkAssetConfig.events.createNote,
            IZkAssetConfig.events.destroyNote,
            IZkAssetConfig.events.updateNoteMetaData,
        ]
            .map(e => IZkAssetConfig.config.abi.find(({ name, type }) => name === e && type === 'event'))
            .map(abi.encodeEventSignature);

        const options = { fromBlock: 1, toBlock: 'latest', topics: [['0x5ffb3072e4515cf3bfae8b16be9dff6313cf7c313a0c26faafe6971d8c7585f1', '0xebd4bb7b61198df63305dd538f077db9df9b14339d8a6221e301487770d79227', '0xda392cb8aa0843e7e474e7bacfae355313fc4202094b3e81d2a488b5c05207bf']] };

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
        console.log(`Decode raw logs took: ${((t1 - t0) / 1000)} seconds.`);

        t0 = performance.now();
        const notes = associatedNotesWithOwner(decodedLogs, sender.address);
        t1 = performance.now();
        console.log(`Filtering logs took: ${((t1 - t0) / 1000)} seconds.`);

        t0 = performance.now();
        await saveNotes(notes);
        t1 = performance.now();
        console.log(`Saving logs into fake db took: ${((t1 - t0) / 1000)} seconds.`);

        const tEnd = performance.now();

        // result
        console.log(`Full amount of time: ${((tEnd - tStart) / 1000)} seconds.`);
    });
});
