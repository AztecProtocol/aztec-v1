import {
    set,
} from '~/utils/storage';
import {
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
    apiKey,
    providerUrl = '',
    contractAddresses = {},
}) {
    await Web3Service.init({
        providerUrl,
    });

    const {
        networkId,
        account,
    } = Web3Service;

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

    Web3Service.registerContractsConfig(contractsConfig);

    await set({
        apiKey,
        networkId,
    });

    return {
        networkId,
        providerUrl,
        contractsConfig,
        account,
    };
}
