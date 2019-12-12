const AZTECAccountRegistryGSN = require('../contracts/AZTECAccountRegistryGSN');

const AZTECAccountRegistryGSNConfig = {
    name: 'AZTECAccountRegistryGSN',
    events: {
        registerExtension: 'RegisterExtension',
        GSNTransactionProcessed: 'GSNTransactionProcessed',
    },
    config: AZTECAccountRegistryGSN,
    networks: {
        1: process.env.MAIN_AZTECAccountRegistryGSN,
        3: process.env.ROPSTEN_AZTECAccountRegistryGSN,
        4: process.env.RINKEBY_AZTECAccountRegistryGSN,
        5: process.env.GOERLI_AZTECAccountRegistryGSN,
        42: process.env.KOVAN_AZTECAccountRegistryGSN,
    },
};

module.exports = {
    AZTECAccountRegistryGSNConfig,
};
