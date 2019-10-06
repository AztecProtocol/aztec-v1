import Web3 from 'web3';
import AuthService from './helpers/AuthService';
/* eslint-enable */
import Web3Service from '~background/services/Web3Service';
import decodeNoteLogs from '../helpers/decodeNoteLogs';
import associatedNotesWithOwner from '../helpers/associatedNotesWithOwner';
import saveNotes from '../saveNotes';
import {
    IZkAssetConfig,
    AZTECAccountRegistryConfig,
    ACEConfig,
} from '~background/config/contracts';
import Web3ServiceFactory from '~background/services/Web3Service/factory';
import ZkAssetEventsEmitterTest from '~background/contracts/ZkAssetEventsEmitterTest';
import { infuraHttpProviderURI } from '~background/helpers/InfuraTestCreds';


jest.setTimeout(500000000);


describe('ZkAsset', () => {
    // const providerUrl = infuraHttpProviderURI;
    const providerUrlGanache = 'ws://localhost:8545';
    const networkId = 0;
    const prepopulateEventsCount = 9000;
    const eventsPerTransaction = 500;
    let sender;
    let web3Service;
    let assetEventsEmitterAddress = '0x99b8385e3d95c13e7239ef2382f71d810b1c623a';

    const noteHash = '0x04fde05cf388662b8e6b239d39eac4a44c03d680f228c299af21ca45a5273aa8';
    const metadata = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d2aa20b114056776ecb0cfae9cd3a98dc0ffdc37fd68ca923384a0cc84292d656a01000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000000000010100000000000000000000000000000000000000000000000000000000000001f3000000000000000000000000000000000000000000000000000000000000000100000000000000000000000027b60ccecad263fd6ba595c68ad0e4c968ad9c6700000000000000000000000000000000000000000000000000000000000000012f2cd31e072ba6a7d8e93d5da87c24c69c0b5cf99948993614456208eb50a25dbd1ce4e7b3f428f8d176abe670eb3f6faff2aaef376c58098256d1a784ddce6d733f1e53a39785ded27b8500b7ce8e9f15064b5a5f8f0dd379caa471971aba272d2fda61a1e5038b5d2029d6471812efda34a196e4ed8716f06093dc2993d7b3a88ba9847f734ac6d4a240fca14719d802aa5c9b2500592ad9b6399de3e0023661b4a13c99508aad7ab430aa427932d4bacd0e715919ed632419182b1bd0bb0490f4dc14238d243e1e49595978598f5726d70000000000000000000000000000000000000000000000000000000000000000';
    const owner = '0xBE9DFf6313Cf7C313a0C26FAaFE6971D8C7585F1';
    const noteAccess = {
        address: '0x27b60ccecad263fd6ba595c68ad0e4c968ad9c67',
    };

    const generateCreateNoteEvents = (owner, countEvents) => ({
        owner,
        noteHash,
        metadata,
        count: countEvents,
    });

    const optionsForAllEvents = (address) => {
        const { abi } = Web3Service.eth;

        const eventsTopics = [
            IZkAssetConfig.events.createNote,
            IZkAssetConfig.events.destroyNote,
            IZkAssetConfig.events.updateNoteMetaData,
        ]
            .map(e => IZkAssetConfig.config.abi.find(({ name, type }) => name === e && type === 'event'))
            .map(abi.encodeEventSignature);

        const options = {
            address,
            fromBlock: 1,
            toBlock: 'latest',
            topics: [
                eventsTopics,
            ],
        };
        return options;
    };

    const configureWeb3Service = async () => {    
        const contractsConfigs = [
            AZTECAccountRegistryConfig.config,
            ACEConfig.config,
        ];

        const ganacheNetworkConfig = {
            title: 'Ganache',
            networkId: 0,
            providerUrl: providerUrlGanache,
            contractsConfigs,
        };

        Web3ServiceFactory.setConfigs([
            ...[ganacheNetworkConfig],
        ]);
    };

    beforeAll(async () => {
        sender = AuthService.getAccount();

        web3Service = Web3Service(networkId, sender);

        if (!assetEventsEmitterAddress) {
            console.log('Deploying Events emitter...');
            ({
                address: assetEventsEmitterAddress,
            } = await Web3Service.deploy(ZkAssetEventsEmitterTest));
            console.log(`Set contract address: "${assetEventsEmitterAddress}" to assetEventsEmitterAddress 
                to prevent creation smart contract each time and prepopulate it with events`);
        } else {
            console.log('ZkAssetEventsEmitterTest exists...');
            Web3Service.registerContract(ZkAssetEventsEmitterTest, { address: assetEventsEmitterAddress });
        }

        const options = optionsForAllEvents(assetEventsEmitterAddress);
        const { getPastLogs } = Web3Service.eth;
        const rawLogs = await getPastLogs(options);

        let createdEvents = rawLogs.length;

        if (prepopulateEventsCount < eventsPerTransaction) {
            console.warn('eventsPerTransaction should be less than prepopulateEventsCount');
        }

        console.log(`Already exists ${rawLogs.length} of ${prepopulateEventsCount}  events`);
        while (createdEvents < prepopulateEventsCount) {
            const eventData = generateCreateNoteEvents(sender.address, eventsPerTransaction);

            await Web3Service
                .useContract('ZkAssetEventsEmitterTest')
                .at(assetEventsEmitterAddress)
                .method('emitCreateNote')
                .send(
                    eventData.owner,
                    eventData.noteHash,
                    eventData.metadata,
                    eventData.count,
                );

            createdEvents += eventData.count;
        }
    });


    it.skip(`check how does it take to fetch ${prepopulateEventsCount} events, filter by owner and store into faked db`, async () => {
        // given
        const options = optionsForAllEvents(assetEventsEmitterAddress);
        const eventsTopics = options.topics[0];
        const { getPastLogs } = Web3Service.eth;

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
        console.log(`Decode raw logs createNotes: ${decodedLogs.createNotes.length} tooks: ${((t1 - t0) / 1000)} seconds.`);

        t0 = performance.now();
        const notes = associatedNotesWithOwner(decodedLogs, owner);
        t1 = performance.now();
        console.log(`Filtering logs createNotes: ${notes.createNotes.length} took: ${((t1 - t0) / 1000)} seconds.`);

        t0 = performance.now();
        await saveNotes(notes);
        t1 = performance.now();
        console.log(`Saving logs createNotes: ${notes.createNotes.length} into fake db took: ${((t1 - t0) / 1000)} seconds.`);

        const tEnd = performance.now();

        // result
        console.log(`Full amount of time: ${((tEnd - tStart) / 1000)} seconds.`);
    });
});
