const { AccountRegistry } = require('@aztec/contract-artifacts');

const AccountRegistryConfig = {
    name: 'AccountRegistry',
    events: {
        registerExtension: 'RegisterExtension',
        GSNTransactionProcessed: 'GSNTransactionProcessed',
    },
    config: AccountRegistry,
    networks: {
        4: process.env.RINKEBY_AZTECAccountRegistryGSN,
        1: process.env.MAINNET_AZTECAccountRegistryGSN,
    },
};

module.exports = {
    AccountRegistry: AccountRegistryConfig,
};
