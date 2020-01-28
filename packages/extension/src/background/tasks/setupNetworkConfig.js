import {
    set,
} from '~/utils/storage';
import {
    getContract,
    getProxyAddress,
} from '~/utils/network';
import Web3Service from '~/helpers/Web3Service';

const backgroundContracts = [
    'ACE',
    'AccountRegistry',
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

    const contractsConfig = await Promise.all(backgroundContracts.map(async (contractName) => {
        const {
            contract,
            address,
            isProxyContract,
        } = getContract(contractName, networkId);
        let proxyAddress;
        if (isProxyContract) {
            proxyAddress = await getProxyAddress(contractName, networkId);
        }
        return {
            name: contractName,
            config: contract,
            address: contractAddresses[contractName]
                || isProxyContract ? proxyAddress : address,
        };
    }));
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
