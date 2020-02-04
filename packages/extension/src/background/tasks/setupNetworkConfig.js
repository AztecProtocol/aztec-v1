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
            address: defaultAddress,
            isProxyContract,
        } = getContract(contractName, networkId);
        let address = contractAddresses[contractName] || defaultAddress;
        if (!address && isProxyContract) {
            address = await getProxyAddress(
                contractName,
                networkId,
                contractAddresses,
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
