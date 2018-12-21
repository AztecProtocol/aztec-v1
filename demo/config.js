/**
 * Configuration variables
 *
 * @module config
 */

const BN = require('bn.js');

const environment = {
    TEST: {
        db: 'dbTest.json',
        provider: 'ws://localhost:8545',
        gasPrice: '10',
        env: 'TEST',
    },
    DEVELOPMENT: {
        db: 'dbDevelopment.json',
        provider: 'ws://localhost:8545',
        gasPrice: '10',
        env: 'DEVELOPMENT',
    },
    RINKEBY: {
        db: 'dbRinkeby.json',
        provider: 'wss://rinkeby.infura.io/ws',
        gasPrice: '10',
        env: 'RINKEBY',
    },
    KOVAN: {
        db: 'dbRinkeby.json',
        provider: 'wss://rinkeby.infura.io/ws',
        gasPrice: '10',
        env: 'RINKEBY',
    },
    ROPSTEN: {
        db: 'dbRinkeby.json',
        provider: 'wss://rinkeby.infura.io/ws',
        gasPrice: '10',
        env: 'RINKEBY',
    },
    MAINNET: {
        db: 'dbMainNet.json',
        provider: 'wss://mainnet.infura.io/ws',
        gasPrice: '5',
        env: 'MAINNET',
    },
    NONE: {
        env: 'NONE',
        db: 'none.json',
    },
};

const config = {
    /**
     * @enum {TX_TYPES}
     * @memberof module:config
     * @description Transaction type enum
     */
    TX_TYPES: {
        AZTEC_TOKEN_CONFIDENTIAL_TRANSFER: 'AZTEC_TOKEN_CONFIDENTIAL_TRANSFER',
        AZTEC_JOIN_SPLIT: 'AZTEC_JOIN_SPLIT',
        DOORBELL_SET_BLOCK: 'DOORBELL_SET_BLOCK',
        ERC20_APPROVE: 'ERC20_APPROVE',
        ERC20_MINT: 'ERC20_MINT',
    },
    /**
     * @enum {TX_STATUS}
     * @memberof module:config
     * @description Transaction status enum
     */
    TX_STATUS: {
        UNSIGNED: 'UNSIGNED',
        SENT: 'SENT',
        MINED: 'MINED',
    },
    /**
     * @enum {NOTE_STATUS}
     * @memberof module:config
     * @description Note status enum
     */
    NOTE_STATUS: {
        OFF_CHAIN: 'OFF_CHAIN',
        UNSPENT: 'UNSPENT',
        SPENT: 'SPENT',
    },
    daiAddress: '0x89d24a6b4ccb1b6faa2625fe562bdd9a23260359', // address of the mainNet DAI smart contract
    // generic scaling factor that maps between AZTEC note values and ERC20 token balances.
    // when used for DAI token, 1 AZTEC note value = 0.1 DAI
    erc20ScalingFactor: new BN('100000000000000000', 10),
};

function getConfig() {
    const nodeEnv = process.env.NODE_ENV;
    const params = environment[nodeEnv];
    if (!params) {
        return {
            ...environment.TEST,
            ...config,
        };
    }
    return {
        ...params,
        ...config,
    };
}

module.exports = getConfig();
