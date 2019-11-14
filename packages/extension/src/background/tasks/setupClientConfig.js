import {
    getNetworkById,
    getContract,
} from '~/utils/network';
import AuthService from '~/background/services/AuthService';
import NetworkService from '~helpers/NetworkService/factory';

const backgroundContracts = [
    'ACE',
    'AZTECAccountRegistry',
    'ZkAsset',
];

export default async function setupClientConfig({
    providerUrl,
    networkId,
    contractAddresses,
    currentAddress,
}) {
    await AuthService.setNetworkConfig({
        networkId,
        currentAddress,
    });

    const network = getNetworkById(networkId);
    const contractsConfigs = backgroundContracts.map((contractName) => {
        const {
            contract,
            address,
        } = getContract(contractName, networkId);
        return {
            config: contract,
            address: contractAddresses[contractName]
                || address
                || (contract.networks[networkId] || {}).address,
        };
    });

    const config = {
        networkId,
        title: network.networkName,
        providerUrl: providerUrl || network.providerUrl,
        contractsConfigs,
    };

    NetworkService.setConfigs([config]);

    return config;
}
