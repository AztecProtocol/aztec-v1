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
}) {
    const account = {
        address: currentAddress,
    };

    // let gsnConfig;
    // if (account.address) {
    //     const signingInfo = await retrieveSigningInfo(account.address);
    //     const gsnProvider = new GSNProvider(providerUrl, {
    //         pollInterval: 15 * 1000,
    //         signKey: signingInfo.privateKey,
    //         approveFunction,
    //         fixedGasPrice: 2E9,
    //     });
    //     gsnConfig = {
    //         signingInfo,
    //         gsnProvider,
    //     };
    // }

    const contractsConfig = backgroundContracts.map((contractName) => {
        const {
            contract,
            address,
        } = getContract(contractName, networkId);
        return {
            name: contractName,
            config: contract,
            address: contractAddresses[contractName]
                || address
                || (contract.networks[networkId] || {}).address,
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
    });

    await Web3Service.init(config);

    return config;
}
