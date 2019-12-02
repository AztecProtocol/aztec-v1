const infuraURL = (networkName) => {
    return `https://${networkName}.infura.io/v3/${process.env.INFURA_PROJECT_KEY}`;
};

module.exports = {
    TIME_TO_SEND_GSN_TRANSACTION: 86400, // One day 86400
    TRANSACTION_TYPE: {
        PURCHASE: 'purchase',
        REFUND: 'refund',
        SPENDING: 'spending',
    },
    TRANSACTION_STATUS: {
        PENDING: 'pending',
        OK: 'ok',
        FAILED: 'failed',
        EXPIRED: 'expired',
    },
    USER_TYPE: {
        ADMIN: 'admin',
        USER: 'user',
    },
    SHA3_LENGTH: 66,
    TRANSACTION_HASH_LENGTH: 66,
    ETH_ADDRESS_LENGTH: 42,
    EMAIL_ADDRESS_LEGNTH: 60,
    PASSWORD_HASH_LEGNTH: 60,
    NETWORKS: {
        GANACHE: {
            id: null,
            networkName: 'ganache',
            // we use kovan infura just for ganache
            infuraProviderUrl: infuraURL('kovan'),
        },
        MAIN: {
            id: 1,
            networkName: 'mainnet',
            infuraProviderUrl: infuraURL('mainnet'),
        },
        ROPSTEN: {
            id: 3,
            networkName: 'ropsten',
            infuraProviderUrl: infuraURL('ropsten'),
        },
        RINKEBY: {
            id: 4,
            networkName: 'rinkeby',
            infuraProviderUrl: infuraURL('rinkeby'),
        },
        GOERLI: {
            id: 5,
            networkName: 'goerli',
            infuraProviderUrl: infuraURL('goerli'),
        },
        KOVAN: {
            id: 42,
            networkName: 'kovan',
            infuraProviderUrl: infuraURL('kovan'),
        },
    },
};
