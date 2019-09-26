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
import Web3Service from '~client/services/Web3Service';
import domainModel from '../../database/models/domain';
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry.json';
import ZkAssetTemplate from '../../../build/contracts/ZkAssetTemplate.json';
import NoteService from '~background/services/NoteService';
import Web3ServiceFactory from '~background/services/Web3Service/factory';
// import { runLoadingEventsTest } from './syncTest'


const configureWeb3Service = async () => {
    const providerUrlGanache = await get('__providerUrlGanache');
    const infuraProjectId = await get('__infuraProjectId');

    const contractsConfigs = [
        AZTECAccountRegistryConfig.config,
        ACEConfig.config,
    ];

    const infuraNetworksConfigs = ['mainnet', 'ropsten', 'rinkeby', 'goerli', 'kovan']
        .map(networkName => infuraProviderConfig(networkName, infuraProjectId))
        .map(config => ({
            ...config,
            contractsConfigs,
        }));

    const ganacheNetworkConfig = {
        title: 'Ganache',
        networkId: 0,
        providerUrl: providerUrlGanache,
        contractsConfigs,
    };

    Web3ServiceFactory.setConfigs([
        ...[ganacheNetworkConfig],
        ...infuraNetworksConfigs,
    ]);
};

export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        // chrome.storage.local.clear();

        // comment it
        // await runLoadingEventsTest();

        await set({
            __providerUrlGanache: 'http://localhost:8545',
            __infuraProjectId: '',
        });
        await domainModel.set(
            {
                domain: window.location.origin,
            },
            {
                ignoreDuplicate: true,
            },
        );

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
