import Provider from '~config/provider';
import Web3Service from '~/helpers/Web3Service';

export default async function getGsnConfig() {
    // TODO: check apiKey
    const isGSNAvailable = await Provider.isValidNetworkId(networkId);

    // const isGSNAvailable = false;
    const proxyContract = getContract('AZTECAccountRegistryGSN', networkId).address;

    return {
        isGSNAvailable,
        proxyContract,
    };
}
