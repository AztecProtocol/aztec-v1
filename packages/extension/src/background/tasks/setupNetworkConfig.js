import {
    getContract,
    getProxyAddress,
    getNetworkName,
} from '~/utils/network';
import Web3Service from '~/helpers/Web3Service';

const backgroundContracts = [
    'ACE',
    'AccountRegistry',
    'ZkAsset',
    'ERC20',
    'IERC20Permit',
];

export default async function setupNetworkConfig({
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
    const networkName = getNetworkName(networkId);
    const networkAddresses = contractAddresses[networkName.toLowerCase()] || {};
    const customAddresses = {
        ...contractAddresses,
        ...networkAddresses,
    };

    const contractsConfig = await Promise.all(backgroundContracts.map(async (contractName) => {
        const {
            contract,
            address: defaultAddress,
            isProxyContract,
        } = getContract(contractName, networkId);
        let address = customAddresses[contractName]
            || defaultAddress;
        if (!address && isProxyContract) {
            address = await getProxyAddress(
                contractName,
                networkId,
                customAddresses,
            );
        }

        return {
            name: contractName,
            config: contract,
            address,
        };
    }));
    Web3Service.registerContractsConfig(contractsConfig);

    return {
        networkId,
        providerUrl,
        contractsConfig,
        account,
    };
}
