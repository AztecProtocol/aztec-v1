import Web3Service from '~/helpers/Web3Service';

export default async function getGsnConfig() {
    const isGSNAvailable = false;
    const proxyContract = Web3Service.getAddress('AccountRegistry');

    return {
        isGSNAvailable,
        proxyContract,
    };
}
