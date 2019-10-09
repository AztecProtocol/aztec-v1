// import Web3Service from '~background/services/NetworkService';
// import decodeNoteLogs from '../services/EventService/utils/helpers/decodeNoteLogs';
// import {
//     saveNotes
// } from '../services/EventService/utils/saveNotes';
// import {
//     IZkAssetConfig,
// } from '~config/contracts';
// import { infuraHttpProviderURI } from '~background/helpers/InfuraTestCreds';
// import NetworkService from '~background/services/NetworkService/factory';
// import {
//     AZTECAccountRegistryConfig,
//     ACEConfig,
// } from '~config/contracts';
// import {
//     clearDB
//  } from '~background/database';


// const contractsConfigs = [
//     AZTECAccountRegistryConfig.config,
//     ACEConfig.config,
// ];

// const networksConfig = {
//     title: 'rinkeby',
//     networkId: 9999,
//     providerUrl: infuraHttpProviderURI,
//     contractsConfigs: contractsConfigs,
// };

// const optionsForAllEvents = (address) => {
//     const { abi } = Web3Service().eth;

//     const eventsTopics = [
//         IZkAssetConfig.events.createNote,
//         IZkAssetConfig.events.destroyNote,
//         IZkAssetConfig.events.updateNoteMetaData,
//     ]
//         .map(e => IZkAssetConfig.config.abi.find(({name, type})=> name === e && type === 'event'))
//         .map(abi.encodeEventSignature);

//     const options = {
//         "address": address,
//         "fromBlock": 1,
//         "toBlock": "latest",
//         "topics":[
//             eventsTopics,
//         ]};
//     return options;
// }


// export const runLoadingEventsTest = async () => {
//     console.log(`This is only for testing purpuse (measure speed of loading, storing items into real IndexedDB). Please disable it if you dont know what it is`)

//     clearDB({networkId: networksConfig.networkId});

//     NetworkService.setConfigs([networksConfig]);

//     const owner = {
//         address: '0x27b60ccecad263fd6ba595c68ad0e4c968ad9c67',
//     }

//     let assetEventsEmitterAddress = '0x99b8385e3d95c13e7239ef2382f71d810b1c623a';

//     // given
//     const options = optionsForAllEvents(assetEventsEmitterAddress);
//     const eventsTopics = options.topics[0];
//     const { getPastLogs } = Web3Service().eth;

//     // action
//     const tStart = performance.now();
//     let t0 = tStart;
//     let t1;
//     const rawLogs = await getPastLogs(options);
//     t1 = performance.now();
//     console.log(`Load past logs ${rawLogs.length} took: ${((t1 - t0) / 1000)} seconds.`);

//     t0 = performance.now();
//     const decodedLogs = decodeNoteLogs(eventsTopics, rawLogs, networksConfig.networkId);
//     t1 = performance.now();
//     console.log(`Decode raw logs ${decodedLogs.createNotes.length} took: ${((t1 - t0) / 1000)} seconds.`)

//     console.log(`${JSON.stringify(decodedLogs)}`)

//     t0 = performance.now();
//     await saveNotes(decodedLogs, networksConfig.networkId);
//     t1 = performance.now();
//     console.log(`Saving logs ${decodedLogs.createNotes.length} into indexedDB db took: ${((t1 - t0) / 1000)} seconds.`)

//     const tEnd = performance.now();

//     // result
//     console.log(`Full amount of time: ${((tEnd - tStart) / 1000)} seconds.`)
// }
