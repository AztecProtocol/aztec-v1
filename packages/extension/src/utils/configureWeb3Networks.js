import {
    NETWORKS,
} from '~config/constants';
import {
    get,
} from '~utils/storage';

import Provider from '~/config/provider';
import {
    AZTECAccountRegistryConfig,
    ACEConfig,
    IZkAssetConfig,
} from '~/config/contracts';
import NetworkService from '~helpers/NetworkService/factory';
import getGanacheNetworkId from '~utils/getGanacheNetworkId';

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

    const ganacheNetworkId = getGanacheNetworkId();
    const {
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

export default configureWeb3Networks;
