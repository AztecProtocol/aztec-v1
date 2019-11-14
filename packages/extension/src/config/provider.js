import {
    NETWORKS,
} from '~config/constants';

const infuraProjectId = '09c4eed231c840d5ace14ba5389a1a7c';

export const infuraConfig = ({ id: networkId, networkName }, projectId = infuraProjectId) => ({
    title: networkName,
    networkId,
    providerUrl: `wss://${networkName}.infura.io/ws/v3/${projectId}`,
});

const availableNetworks = () => Object.values(NETWORKS).map(({ id }) => id);

const isValidNetworkId = networkId => availableNetworks.includes(networkId);

export const defaultProviderUrl = 'ws://localhost:8545';

export default {
    infuraConfig,
    availableNetworks,
    isValidNetworkId,
};
