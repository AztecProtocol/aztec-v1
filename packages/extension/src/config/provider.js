import {
    NETWORKS,
    NETWORKS_NAMES,
    INFURA_NETWORKS,
    INFURA_API_KEY,
} from '~config/constants';


const infuraConfig = ({ id: networkId, networkName }, projectId) =>  {
    const name = networkName || NETWORKS_NAMES(networkId);
    return {
        title: name,
        networkId,
        providerUrl: `wss://${name}.infura.io/ws/v3/${projectId}`,
    };
};

const ganacheProvider = (networkId, port = 8545) => ({
    title: 'ganache',
    networkId,
    providerUrl: `http://localhost:${port}`,
});

const availableNetworks = () => Object.values(NETWORKS).map(({ id }) => id);

const isValidNetworkId = networkId => availableNetworks().includes(networkId);

const isInfuraNetworkId = networkId => INFURA_NETWORKS.includes(parseInt(networkId, 10));

const getProvider = (networkId) => {
    if (isInfuraNetworkId(networkId)) {
        return infuraConfig({
            id: networkId,
        }, INFURA_API_KEY);
    }
    return ganacheProvider(networkId);
};

export default {
    infuraConfig,
    availableNetworks,
    isValidNetworkId,
    getProvider,
};
