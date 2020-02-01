import Web3Service from '~/helpers/Web3Service';
import ConnectionService from '~/ui/services/ConnectionService';

export default async function getGsnConfig() {
    const response = await ConnectionService.post({
        action: 'apiKeyQuota',
    });
    const {
        hasFreeTransactions,
    } = response || {};

    const isGSNAvailable = hasFreeTransactions;
    const proxyContract = Web3Service.getAddress('AccountRegistry');

    return {
        isGSNAvailable,
        proxyContract,
    };
}
