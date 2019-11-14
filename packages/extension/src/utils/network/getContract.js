import {
    AZTECAccountRegistryConfig,
    ACEConfig,
    IZkAssetConfig,
} from '~/config/contracts';
import {
    warnLog,
} from '~/utils/log';

const contractMapping = {
    ACE: ACEConfig,
    AZTECAccountRegistry: AZTECAccountRegistryConfig,
    ZkAsset: IZkAssetConfig,
};

export default function getContract(contractName, networkId) {
    const {
        config,
        networks,
    } = contractMapping[contractName] || {};
    if (!config) {
        warnLog(`Contract ${contractName} is not defined in '~/config/contracts'`);
    }

    return {
        contract: config,
        address: (networks && networks[networkId]) || '',
    };
}
