import Provider from '~config/provider';
import Web3Service from '~/helpers/Web3Service';

export default async function getGsnConfig(address) {
    // TODO: check apiKey
    const isGSNAvailable = await Provider.isValidNetworkId(Web3Service.networkId);

    // const isGSNAvailable = false;
    const proxyContract = Web3Service.getAddress('AZTECAccountRegistryGSN');

    return {
        isGSNAvailable,
        proxyContract,
    };
}
