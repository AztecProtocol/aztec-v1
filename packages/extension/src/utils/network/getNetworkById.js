import networks from '~/config/networks';
import {
    infuraConfig,
    defaultProviderUrl,
} from '~/config/provider';

export default function getNetworkById(networkId) {
    let network = Object.keys(networks)
        .find(name => networks[name].id === networkId);
    if (network) {
        const {
            providerUrl,
        } = infuraConfig({
            id: networkId,
            networkName: network.networkName,
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
