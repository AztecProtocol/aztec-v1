import Web3 from 'web3';
import AuthService from './helpers/AuthService';
/* eslint-enable */
import Web3Service from '~helpers/NetworkService';
import {
    IZkAssetConfig,
} from '~config/contracts';
import ZkAssetEventsEmitterTest from '~background/contracts/ZkAssetEventsEmitterTest';
import { infuraHttpProviderURI } from '~background/helpers/InfuraTestCreds';


jest.setTimeout(5000000);


describe('ZkAsset', () => {
    const isGancheProvider = false;
    const ganacheProviderUrl = 'http://localhost:8545';

    const prepopulateEventsCount = 9500;
    const eventsPerTransaction = 9500;
    const countFilterNoteHashTopics = 9500;
    const metadata = '0x00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000001d2aa20b114056776ecb0cfae9cd3a98dc0ffdc37fd68ca923384a0cc84292d656a01000000000000000000000000000000000000000000000000000000000000c1000000000000000000000000000000000000000000000000000000000000010100000000000000000000000000000000000000000000000000000000000001f3000000000000000000000000000000000000000000000000000000000000000100000000000000000000000027b60ccecad263fd6ba595c68ad0e4c968ad9c6700000000000000000000000000000000000000000000000000000000000000012f2cd31e072ba6a7d8e93d5da87c24c69c0b5cf99948993614456208eb50a25dbd1ce4e7b3f428f8d176abe670eb3f6faff2aaef376c58098256d1a784ddce6d733f1e53a39785ded27b8500b7ce8e9f15064b5a5f8f0dd379caa471971aba272d2fda61a1e5038b5d2029d6471812efda34a196e4ed8716f06093dc2993d7b3a88ba9847f734ac6d4a240fca14719d802aa5c9b2500592ad9b6399de3e0023661b4a13c99508aad7ab430aa427932d4bacd0e715919ed632419182b1bd0bb0490f4dc14238d243e1e49595978598f5726d70000000000000000000000000000000000000000000000000000000000000000';

    let sender;
    let web3Service;
    let assetEventsEmitterAddress = '0x67995fa2131b79af3fab4d1062451bd07ce96010';


    const generateCreateNoteEvents = (owner, countEvents) => ({
        owner,
        metadata,
        // Index is note hash
        count: countEvents,
    });

    const generateHoteHashes = (count) => {
        const { abi } = web3Service.eth;
        const noteHashTopics = new Array(count);
        for (let i = 0; i < noteHashTopics.length; i++) {
            noteHashTopics[i] = abi.encodeParameter('bytes32', Web3.utils.toTwosComplement(i + 1));
        }
        return noteHashTopics;
    };

    const optionsForAllEvents = (address, countNoteHashTopics) => {
        const { abi } = web3Service.eth;

        const eventsTopics = [
            IZkAssetConfig.events.createNote,
            IZkAssetConfig.events.destroyNote,
            IZkAssetConfig.events.updateNoteMetaData,
        ]
            .map(e => IZkAssetConfig.config.abi.find(({ name, type }) => name === e && type === 'event'))
            .map(abi.encodeEventSignature);

        const noteHashTopics = countNoteHashTopics ? generateHoteHashes(countNoteHashTopics) : [];

        const options = {
            address,
            fromBlock: 1,
            toBlock: 'latest',
            topics: [
                eventsTopics,
                null, // owner topics
                noteHashTopics,
            ],
        };
        return { options, eventsTopics };
    };

    beforeAll(async () => {
        sender = AuthService.getAccount();
        web3Service = await Web3Service();

        const provider = new Web3.providers.HttpProvider(isGancheProvider ? ganacheProviderUrl : infuraHttpProviderURI);
        // Web3Service.init({ provider, account: sender });

        if (isGancheProvider && !assetEventsEmitterAddress) {
            console.log('Deploying Events emitter...');
            ({
                address: assetEventsEmitterAddress,
            } = await web3Service.deploy(ZkAssetEventsEmitterTest));
            console.log(`Set contract address: "${assetEventsEmitterAddress}" to assetEventsEmitterAddress 
                to prevent creation smart contract each time and prepopulate it with events`);
        }

        if (!assetEventsEmitterAddress) {
            console.warn('eventsPerTransaction is not set, please set it');
            return;
        }

        if (!isGancheProvider) {
            console.log(`Using ${assetEventsEmitterAddress} ZkAssetEventsEmitter address...`);
            web3Service.registerContract(ZkAssetEventsEmitterTest, { address: assetEventsEmitterAddress });
        }

        if (prepopulateEventsCount < eventsPerTransaction) {
            console.warn('eventsPerTransaction should be less than prepopulateEventsCount');
        }
        const alreadyExistEventsCount = await web3Service
            .useContract('ZkAssetEventsEmitterTest')
            .at(assetEventsEmitterAddress)
            .method('createdNotes')
            .call();

        console.log(`Already exists ${alreadyExistEventsCount} of ${prepopulateEventsCount} events`);
        if (!isGancheProvider && alreadyExistEventsCount < prepopulateEventsCount) {
            console.log('Skipping prepopulation cause not ganache provider');
        }

        let prepopulatedCount = alreadyExistEventsCount;
        while (isGancheProvider && prepopulatedCount < prepopulateEventsCount) {
            const eventData = generateCreateNoteEvents(sender.address, eventsPerTransaction);

            await web3Service
                .useContract('ZkAssetEventsEmitterTest')
                .at(assetEventsEmitterAddress)
                .method('emitCreateNote')
                .send(
                    eventData.owner,
                    eventData.noteHash,
                    eventData.metadata,
                    eventData.count,
                );

            prepopulatedCount += eventData.count;
        }
    });


    it.skip(`check limits: ${countFilterNoteHashTopics} noteHash topics`, async () => {
        // given
        const {
            options,
        } = optionsForAllEvents(assetEventsEmitterAddress, countFilterNoteHashTopics);

        const { getPastLogs } = web3Service.eth;

        // action
        const t0 = performance.now();
        const rawLogs = await getPastLogs(options);
        const t1 = performance.now();
        console.log(`Load past logs (${rawLogs.length}) with filtering by ${countFilterNoteHashTopics} topics took: ${((t1 - t0) / 1000)} seconds.`);

        // expectation
        expect(rawLogs.length).toEqual(countFilterNoteHashTopics);
    });

    it.skip('check loading all logs without filtering topics', async () => {
        // given
        const {
            options,
        } = optionsForAllEvents(assetEventsEmitterAddress);

        const { getPastLogs } = web3Service.eth;

        // action
        const t0 = performance.now();
        const rawLogs = await getPastLogs(options);
        const t1 = performance.now();
        console.log(`Load past logs (${rawLogs.length}) without filtering topics took: ${((t1 - t0) / 1000)} seconds.`);

        // expectation
        expect(rawLogs.length).toEqual(countFilterNoteHashTopics);
    });
});
