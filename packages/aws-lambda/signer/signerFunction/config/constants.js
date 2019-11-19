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
    ETH_ADDRESS_LENGTH: 42,
};
