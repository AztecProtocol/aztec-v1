import {
    NETWORKS,
} from './constants';

const infuraConfig = ({ id: networkId, networkName }, projectId) => ({
    title: networkName,
    networkId,
    providerUrl: `https://${networkName}.infura.io/v3/${projectId}`,
});

const availableNetworks = () => Object.values(NETWORKS).map(({ id }) => id);

const isValidNetworkId = networkId => availableNetworks.includes(networkId);

export default {
    infuraConfig,
    availableNetworks,
    isValidNetworkId,
};
