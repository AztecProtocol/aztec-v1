import {
    get,
} from '~/utils/storage';
import getContract from '~utils/network/getContract';
import Provider from '~config/provider';

export default async function getGsnConfig() {
    const networkId = await get('networkId');

    // TODO: check apiKey
    const isGSNAvailable = await Provider.isValidNetworkId(networkId);

    const proxyContract = getContract('AZTECAccountRegistryGSN', networkId).address;

    return {
        isGSNAvailable,
        proxyContract,
    };
}
