import Web3Service from '~/client/services/Web3Service';
import {
    AZTECAccountRegistryGSNConfig,
} from '~config/contracts';
import Provider from '~config/provider';

export default async function getGsnConfig() {
    const networkId = await Web3Service.networkId();

    // TODO: check apiKey
    const isGSNAvailable = Provider.isValidNetworkId(networkId);
    const proxyContract = AZTECAccountRegistryGSNConfig.networks[networkId];

    return {
        isGSNAvailable,
        proxyContract,
    };
}
