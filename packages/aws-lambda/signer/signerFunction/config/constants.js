module.exports = {
    AWS_REGION: 'us-east-1',
    DB_TABLE: {
        GSN_API_KEY: 'aztec_gsn_api_keys',
        GSN_TRANSACTIONS: 'aztec_gsn_transactions',
    },
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
    SHA3_LENGTH: 66,
    TRANSACTION_HASH_LENGTH: 66,
    ETH_ADDRESS_LENGTH: 42,
    NETWORKS: {
        GANACHE: {
            id: null,
            networkName: 'ganache',
        },
        MAIN: {
            id: 1,
            networkName: 'mainnet',
        },
        ROPSTEN: {
            id: 3,
            networkName: 'ropsten',
        },
        RINKEBY: {
            id: 4,
            networkName: 'rinkeby',
        },
        GOERLI: {
            id: 5,
            networkName: 'goerli',
        },
        KOVAN: {
            id: 42,
            networkName: 'kovan',
        },
    },
};
