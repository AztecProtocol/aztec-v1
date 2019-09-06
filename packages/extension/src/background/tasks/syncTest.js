import Web3 from 'web3';
import Web3Service from '~background/services/Web3Service';
import decodeNoteLogs from '../services/eventsSyncServices/NoteSyncService/utils/decodeNoteLogs';
import associatedNotesWithOwner from '../services/eventsSyncServices/NoteSyncService/utils/associatedNotesWithOwner';
import saveNotes from '../services/eventsSyncServices/NoteSyncService/utils/saveNotes';
import {
    IZkAssetConfig,
} from '~background/config/contracts';
import { infuraHttpProviderURI } from '~background/helpers/InfuraTestCreds';


const optionsForAllEvents = (address) => {
    const { abi } = Web3Service.eth;

    const eventsTopics = [
        IZkAssetConfig.events.createNote,
        IZkAssetConfig.events.destroyNote,
        IZkAssetConfig.events.updateNoteMetaData,
    ]
        .map(e => IZkAssetConfig.config.abi.find(({name, type})=> name === e && type === 'event'))
        .map(abi.encodeEventSignature);

    const options = {
        "address": address,
        "fromBlock": 1,
        "toBlock": "latest",
        "topics":[
            eventsTopics,
        ]};
    return options;
}


export const runLoadingEventsTest = async () => {
    console.log(`This is only for testing purpuse (measure speed of loading, storing items into real IndexedDB). Please disable it if you dont know what it is`)

    const provider = new Web3.providers.HttpProvider(infuraHttpProviderURI)
    Web3Service.init({
        provider,
    })

    const access = {
        address: '0x27b60ccecad263fd6ba595c68ad0e4c968ad9c67',
    }
    const owner = {
        address: '0x27b60ccecad263fd6ba595c68ad0e4c968ad9c67',
    }

    let assetEventsEmitterAddress = '0x99b8385e3d95c13e7239ef2382f71d810b1c623a';
    const filterByAddress = access.address;

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
    console.log(`Decode raw logs ${decodedLogs.createNotes.length} took: ${((t1 - t0) / 1000)} seconds.`)
    
    t0 = performance.now();
    const notes = associatedNotesWithOwner(decodedLogs, filterByAddress);
    t1 = performance.now();
    console.log(`Filtering logs ${notes.createNotes.length} took: ${((t1 - t0) / 1000)} seconds.`)

    t0 = performance.now();
    await saveNotes(notes);
    t1 = performance.now();
    console.log(`Saving logs ${notes.createNotes.length} into indexedDB db took: ${((t1 - t0) / 1000)} seconds.`)

    const tEnd = performance.now();

    // result
    console.log(`Full amount of time: ${((tEnd - tStart) / 1000)} seconds.`)
}