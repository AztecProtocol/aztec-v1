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
import domainModel from '../../database/models/domain';
import NetworkService from '~background/services/NetworkService/factory';


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

    configureWeb3Networks();
    console.log('____CONFIGURED');
}
