import contracts from './contracts';
import productionArtifacts from './production';
import developmentArtifacts from './development';

const artifacts = (process.env.NODE_ENV === 'production')
    ? productionArtifacts
    : developmentArtifacts;

const configs = {};
Object.keys(contracts).forEach((contractName) => {
    configs[contractName] = {
        ...contracts[contractName],
        config: artifacts[contractName],
    };
});

const {
    AccountRegistry,
    AccountRegistryManager,
    ACE,
    ZkAsset,
    ERC20,
} = configs;

export {
    AccountRegistry,
    AccountRegistryManager,
    ACE,
    ZkAsset,
    ERC20,
};
