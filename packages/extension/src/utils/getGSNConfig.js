import {
    GSNProvider,
} from '@openzeppelin/gsn-provider';
import Provider from '~config/provider';
import Web3Service from '~/helpers/Web3Service';
import approveFunction from '~utils/approveGSNFunction';
import retrieveSigningInfo from '~utils/retrieveSigningInfo';
import { getNetworkById } from '~utils/network';

export default async function getGsnConfig(address) {
    // TODO: check apiKey
    const isGSNAvailable = await Provider.isValidNetworkId(Web3Service.networkId);

    // const isGSNAvailable = false;
    const proxyContract = Web3Service.getAddress('AZTECAccountRegistryGSN');
    const { providerUrl } = getNetworkById(Web3Service.networkId);
    // const signingInfo = await retrieveSigningInfo(address);
    const gsnProvider = new GSNProvider(providerUrl, {
        pollInterval: 15 * 1000,
        signKey: signingInfo.privateKey,
        approveFunction,
    });


    return {
        isGSNAvailable,
        signingInfo,
        gsnProvider,
        proxyContract,
    };
}
