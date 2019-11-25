/* eslint-disable func-names */
/* eslint-disable object-shorthand */
require('dotenv').config();
const { GanacheSubprovider } = require('@0x/subproviders');
const HDWalletProvider = require('truffle-hdwallet-provider');
const ProviderEngine = require('web3-provider-engine');
const { toWei, toHex } = require('web3-utils');

const compilerConfig = require('./compiler');

// You must specify PRIVATE_KEY and INFURA_API_KEY in your .env file
// Feel free to replace PRIVATE_KEY with a MNEMONIC to use an hd wallet

const privateKeys = [process.env.PRIVATE_KEY, process.env.PRIVATE_KEY_2];
const addressIndexToManage = 0;
const numAddresses = 2;

function createProvider(network) {
    if (process.env.CI && process.env.CIRCLE_JOB !== 'artifacts') {
        return {};
    }
    if (!process.env.PRIVATE_KEY && !process.env.MNEMONIC) {
        console.log('Please set either your PRIVATE_KEY or MNEMONIC in a .env file');
        process.exit(1);
    }
    if (!process.env.INFURA_API_KEY) {
        console.log('Please set your INFURA_API_KEY');
        process.exit(1);
    }
    return () => {
        return new HDWalletProvider(
            privateKeys || process.env.MNEMONIC,
            `https://${network}.infura.io/v3/` + process.env.INFURA_API_KEY,
            addressIndexToManage,
            numAddresses,
        );
    };
}

const rinkebyProvider = createProvider('rinkeby');
const mainnetProvider = createProvider('mainnet');
const ropstenProvider = createProvider('ropsten');

const engine = new ProviderEngine();

let ganacheSubprovider = {};
ganacheSubprovider = new GanacheSubprovider({ mnemonic: process.env.TEST_MNEMONIC });
engine.addProvider(ganacheSubprovider);

engine.start((err) => {
    if (err !== undefined) {
        console.log(err);
        process.exit(1);
    }
});

/**
 * HACK: Truffle providers should have `send` function, while `ProviderEngine` creates providers with `sendAsync`,
 * but it can be easily fixed by assigning `sendAsync` to `send`.
 */
engine.send = engine.sendAsync.bind(engine);

module.exports = {
    compilers: {
        solc: {
            version: compilerConfig.solcVersion,
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
                evmVersion: 'petersburg',
            },
        },
    },
    mocha: {
        bail: true,
        enableTimeouts: false,
        reporter: 'spec',
    },
    networks: {
        development: {
            provider: () => engine,
            gas: 6500000,
            gasPrice: toHex(toWei('1', 'gwei')),
            network_id: '*', // eslint-disable-line camelcase
            port: 8545,
        },
        mainnet: {
            provider: () => mainnetProvider(),
            gas: 6000000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '1',
            skipDryRun: true,
        },
        rinkeby: {
            provider: () => rinkebyProvider(),
            gas: 6000000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '4',
            skipDryRun: true,
        },
        ropsten: {
            provider: () => ropstenProvider(),
            gas: 6000000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '3',
            skipDryRun: true,
        },
    },
};
