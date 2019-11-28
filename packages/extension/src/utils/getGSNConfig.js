import Provider from '~config/provider';
import Web3Service from '~/helpers/Web3Service';
import checkQuota from '~utils/checkQuota';
import { warnLogProduction } from '~utils/log';

export default async function getGsnConfig(address) {
    // TODO: check apiKey
    const isGSNAvailable = await Provider.isValidNetworkId(Web3Service.networkId);
    const proxyContract = Web3Service.getAddress('AZTECAccountRegistryGSN');
    const hasFreeTransactions = await checkQuota();
    if (!hasFreeTransactions) {
        warnLogProduction('API key has run out of free txs, please reload the page and try with metamask');
    }
    return {
        isGSNAvailable: isGSNAvailable && hasFreeTransactions,
        proxyContract,
    };
}
