import {
    set,
} from '~utils/storage';
import {
    getNetworkById,
    getContract,
} from '~/utils/network';
import Web3Service from '~/helpers/Web3Service';

const backgroundContracts = [
    'ACE',
    'AZTECAccountRegistry',
    'AZTECAccountRegistryGSN',
    'ZkAsset',
    'ERC20',
];

export default async function setupNetworkConfig({
    providerUrl,
    networkId,
    contractAddresses,
    currentAddress,
    apiKey,
}) {
    const account = {
        address: currentAddress,
    };

    const contractsConfig = backgroundContracts.map((contractName) => {
        const {
            contract,
            address,
        } = getContract(contractName, networkId);
        return {
            name: contractName,
            config: contract,
            address: contractAddresses[contractName]
                || address,
        };
    });

    const {
        networkName,
        providerUrl: networkProviderUrl,
    } = getNetworkById(networkId);

    const config = {
        networkId,
        networkName,
        providerUrl: providerUrl || networkProviderUrl,
        contractsConfig,
        account,
    };

    await set({
        networkId,
        apiKey,
    });

    await Web3Service.init(config);

    return config;
}
