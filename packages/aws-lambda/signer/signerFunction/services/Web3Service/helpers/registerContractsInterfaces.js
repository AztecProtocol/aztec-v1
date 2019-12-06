const {
    AZTECAccountRegistryGSNConfig,
} = require('../../../config/contracts');


module.exports = (web3Service) => {
    web3Service.registerInterface(AZTECAccountRegistryGSNConfig.config);
};
