import Web3Service from '~/helpers/Web3Service';

export default async function getGsnConfig() {
    // TODO: check apiKey
    const isGSNAvailable = Web3Service.networkId > 0;

    const proxyContract = Web3Service.getAddress('AZTECAccountRegistryGSN');

    return {
        isGSNAvailable,
        proxyContract,
    };
}
