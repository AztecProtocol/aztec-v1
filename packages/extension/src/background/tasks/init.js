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
import {
    infuraProviderConfig,
} from '../config/infura';
import settings from '~background/utils/settings';
import SyncService from '~background/services/SyncService';
import GraphNodeService from '~background/services/GraphNodeService';
import NoteService from '~background/services/NoteService';
import Web3ServiceFactory from '~background/services/Web3Service/factory';
import EventService from '~background/services/EventService';
// import { runLoadingEventsTest } from './syncTest'



const configureWeb3Service = async () => {
    const providerUrlGanache = await get('__providerUrlGanache');
    const infuraProjectId = await get('__infuraProjectId');
    
    const contractsConfigs = [
        AZTECAccountRegistryConfig.config,
        ACEConfig.config,
    ];

    const infuraNetworks = ['mainnet', 'ropsten', 'rinkeby', 'goerli', 'kovan']
        .map((networkName) => infuraProviderConfig(networkName, infuraProjectId))
        .map(config => ({
            ...config,
            contractsConfigs,
        }));

    const networksConfigs = [
        {
            title: 'Ganache',
            networkId: 0,
            providerUrl: providerUrlGanache,
            contractsConfigs,
        },
        ...infuraNetworks,
    ];
    Web3ServiceFactory.setConfigs(networksConfigs);
}

export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        // chrome.storage.local.clear();

        // comment it
        // await runLoadingEventsTest();

        await set({
            // __graphNode: 'http://localhost:4000/',
            __graphNode: 'http://127.0.0.1:8000/subgraphs/name/aztec/note-management',
            __providerUrlGanache: 'http://localhost:8545',
            __infuraProjectId: '',
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

    NoteService.init();
}