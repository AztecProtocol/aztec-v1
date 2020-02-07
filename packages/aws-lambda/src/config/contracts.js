const { Behaviour20200106 } = require('@aztec/contract-artifacts');

const AccountRegistryConfig = {
    name: 'AccountRegistry',
    events: {
        registerExtension: 'RegisterExtension',
        GSNTransactionProcessed: 'GSNTransactionProcessed',
    },
    config: Behaviour20200106,
    networks: {
        4: process.env.RINKEBY_AZTECAccountRegistryGSN,
        1: process.env.MAIN_AZTECAccountRegistryGSN,
    },
};

module.exports = {
    AccountRegistry: AccountRegistryConfig,
};
