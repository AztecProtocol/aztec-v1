import networks from '~/config/networks';
import {
    infuraProjectId,
    infuraProviderUrlPattern,
    defaultProviderUrl,
} from '~/config/provider';
import formatStrPattern from '~/utils/formatStrPattern';

export default function getProviderUrl(networkId, projectId = infuraProjectId) {
    const networkKey = Object.keys(networks)
        .find(name => networks[name].id === networkId);
    const network = networks[networkKey];
    if (!network) {
        return defaultProviderUrl;
    }

    const {
        networkName,
    } = network;

    return formatStrPattern(infuraProviderUrlPattern, {
        networkName,
        projectId,
    });
}
