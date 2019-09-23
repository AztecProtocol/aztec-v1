import Web3ServiceFactory from '~background/services/Web3Service/factory';
import {
    AZTECAccountRegistryConfig,
    ACEConfig,
} from '~background/config/contracts';


export default async function configureFactory() {
    const providerUrlGanache = 'http://localhost:8545';

    const contractsConfigs = [
        AZTECAccountRegistryConfig.config,
        ACEConfig.config,
    ];

    const ganacheNetworkConfig = {
        title: 'Ganache',
        networkId: 0,
        providerUrl: providerUrlGanache,
        contractsConfigs,
    };

    Web3ServiceFactory.setConfigs([
        ...[ganacheNetworkConfig],
    ]);
}
