import Provider from '~config/provider';
import Web3Service from '~/ui/services/Web3Service';

export default async function getGsnConfig() {
    // TODO: check apiKey
    const isGSNAvailable = await Provider.isValidNetworkId(networkId);

    const proxyContract = Web3Service.getAddress('AZTECAccountRegistry');

    return {
        isGSNAvailable,
        proxyContract,
    };
}
