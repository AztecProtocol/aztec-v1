const AZTECAccountRegistryGSN = require('../contracts/AZTECAccountRegistryGSN');

const AZTECAccountRegistryGSNConfig = {
    name: 'AZTECAccountRegistryGSN',
    events: {
        registerExtension: 'RegisterExtension',
        GSNTransactionProcessed: 'GSNTransactionProcessed',
    },
    config: AZTECAccountRegistryGSN,
    networks: {
        4: process.env.RINKEBY_AZTECAccountRegistryGSN,
    },
};

module.exports = {
    AZTECAccountRegistryGSNConfig,
};
