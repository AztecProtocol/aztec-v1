import networks from '~/config/networks';
import {
    infuraProjectId,
    infuraHttpProviderUrlPattern,
    infuraWsProviderUrlPattern,
    defaultProviderUrl,
} from '~/config/provider';
import {
    formatStrPattern,
} from '~/utils/format';

export default function getProviderUrl(networkId, ws = false, projectId = infuraProjectId) {
    const networkKey = Object.keys(networks)
        .find(name => networks[name].id === networkId);
    const network = networks[networkKey];
    if (!network) {
        return defaultProviderUrl;
    }

    const {
        networkName,
    } = network;

    return formatStrPattern(ws ? infuraWsProviderUrlPattern : infuraHttpProviderUrlPattern, {
        networkName: networkName.toLowerCase(),
        projectId,
    });
}
