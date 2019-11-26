import networks from '~/config/networks';
import {
    infuraConfig,
    defaultProviderUrl,
} from '~/config/provider';

export default function getNetworkById(networkId) {
    const networkKey = Object.keys(networks)
        .find(name => networks[name].id === networkId);
    let network = networks[networkKey];
    if (network) {
        const {
            providerUrl,
        } = infuraConfig({
            id: networkId,
            networkName: networks[networkKey].networkName,
        });
        network.providerUrl = providerUrl;
    } else {
        network = {
            id: networkId,
            networkName: networks.GANACHE.networkName,
            providerUrl: defaultProviderUrl,
        };
    }

    return network;
}
