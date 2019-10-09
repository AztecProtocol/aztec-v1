/* global chrome */
import {
    get,
    set,
    onIdle,
} from '~utils/storage';
import {
    AZTECAccountRegistryConfig,
    ACEConfig,
    IZkAssetConfig,
} from '~/config/contracts';
import {
    NETWORKS,
} from '~config/constants';
import Provider from '~/config/provider';
import settings from '~background/utils/settings';
import SyncService from '~background/services/SyncService';
import Web3Service from '~utils/Web3Service';
import domainModel from '../../database/models/domain';
import AZTECAccountRegistry from '../../../build/contracts/AZTECAccountRegistry.json';
import ZkAssetMintable from '../../../build/protocol/ZkAssetMintable.json';
import ZkAssetBurnable from '../../../build/protocol/ZkAssetBurnable.json';
import NoteService from '~background/services/NoteService';
import EventService from '~background/services/EventService';
import NetworkService from '~background/services/NetworkService/factory';
// import { runLoadingEventsTest } from './syncTest'


const configureWeb3Networks = async () => {
    const providerUrlGanache = await get('__providerUrl');
    const infuraProjectId = await get('__infuraProjectId');

    const contractsConfigs = [
        AZTECAccountRegistryConfig.config,
        ACEConfig.config,
        IZkAssetConfig.config,
    ];

    const infuraNetworksConfigs = [
        NETWORKS.MAIN,
        NETWORKS.ROPSTEN,
        NETWORKS.RINKEBY,
        NETWORKS.GOERLI,
        NETWORKS.KOVAN,
    ].map(networkName => Provider.infuraConfig(networkName, infuraProjectId));

    const {
        id: ganacheNetworkId,
        networkName: ganacheNetworkName,
    } = NETWORKS.GANACHE;
    const ganacheNetworkConfig = {
        title: ganacheNetworkName,
        networkId: ganacheNetworkId,
        providerUrl: providerUrlGanache,
    };
    const configs = [
        ...[ganacheNetworkConfig],
        ...infuraNetworksConfigs,
    ].map(config => ({
        ...config,
        contractsConfigs,
    }));

    NetworkService.setConfigs(configs);
};

export default async function init() {
    if (process.env.NODE_ENV !== 'production') {
        // chrome.storage.local.clear();

        // comment it
        // await runLoadingEventsTest();

        await set({
            __providerUrl: 'ws://localhost:8545',
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

    configureWeb3Networks();
    console.log('____CONFIGURED');
}
