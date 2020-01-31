import productionConfig from './production';
import developmentConfig from './development';

const contracts = (process.env.NODE_ENV === 'production')
    ? productionConfig
    : developmentConfig;

const {
    AccountRegistry,
    AccountRegistryManager,
    ACE,
    ZkAsset,
    ERC20,
} = contracts;

export {
    AccountRegistry,
    AccountRegistryManager,
    ACE,
    ZkAsset,
    ERC20,
};
