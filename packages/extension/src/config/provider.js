import {
    NETWORKS,
} from '~config/constants';

const infuraConfig = ({ id: networkId, networkName }, projectId) => ({
    title: networkName,
    networkId,
    providerUrl: `wss://${networkName}.infura.io/ws/v3/${projectId}`,
});

const availableNetworks = () => Object.values(NETWORKS).map(({ id }) => id);

const isValidNetworkId = networkId => availableNetworks.includes(networkId);

export default {
    infuraConfig,
    availableNetworks,
    isValidNetworkId,
};
