const web3Service = require('../services/Web3Service');
const { AZTECAccountRegistryGSNConfig } = require('../config/contracts');

module.exports = () => {
    web3Service.registerInterface(AZTECAccountRegistryGSNConfig.config);
};
