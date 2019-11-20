import productionConfig from './production';
import developmentConfig from './development';

const contracts = (process.env.NODE_ENV === 'production')
    ? productionConfig
    : developmentConfig;

const {
    AZTECAccountRegistry,
    AZTECAccountRegistryGSN,
    ACE,
    ZkAsset,
} = contracts;

export {
    AZTECAccountRegistry,
    AZTECAccountRegistryGSN,
    ACE,
    ZkAsset,
};
