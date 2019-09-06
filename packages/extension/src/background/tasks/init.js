/* global chrome */
import {
    get,
    set,
    onIdle,
} from '~utils/storage';
import {
    AZTECAccountRegistryConfig,
    ACEConfig,
} from '../config/contracts';
import Web3 from 'web3';
import settings from '~background/utils/settings';
import SyncService from '~background/services/SyncService';
import GraphNodeService from '~background/services/GraphNodeService';
import Web3Service from '~background/services/Web3Service';
import NoteService from '~background/services/NoteService';
import NoteRegistrySyncService from '~background/services/eventsSyncServices/NoteRegistrySyncService';
// import { runLoadingEventsTest } from './syncTest'


const configureWeb3Service = async () => {
    const providerUrl = await get('__providerUrl');
    const provider = new Web3.providers.HttpProvider(providerUrl)
    Web3Service.init({
        provider,
    })

    Web3Service.registerContract(AZTECAccountRegistryConfig.config);
    Web3Service.registerContract(ACEConfig.config);
}

export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        // chrome.storage.local.clear();

        // comment it
        // await runLoadingEventsTest();

        await set({
            // __graphNode: 'http://localhost:4000/',
            __graphNode: 'http://127.0.0.1:8000/subgraphs/name/aztec/note-management',
            __providerUrl: 'http://localhost:8545',
        });

        onIdle(
            async () => {
                await set({
                    __sync: 0,
                });
                console.log('--- database idle ---');
                chrome.storage.local.getBytesInUse(null, (bytes) => {
                    console.log('getBytesInUse', bytes);
                });
                chrome.storage.local.get(null, data => console.info(data));
            },
            {
                persistent: true,
            },
        );
    }
    
    SyncService.set({
        notesPerRequest: await settings('NOTES_PER_SYNC_REQUEST'),
        syncInterval: await settings('SYNC_INTERVAL'),
    });

    const graphNodeServerUrl = await get('__graphNode');
    GraphNodeService.set({
        graphNodeServerUrl,
    });

    configureWeb3Service();

    //TODO: Move to right place
    NoteRegistrySyncService.syncCreateNoteRegistries({
        networkId: 0,
    })

    NoteService.init();
}
