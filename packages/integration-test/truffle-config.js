/* eslint-disable func-names */
/* eslint-disable object-shorthand */
require('dotenv').config();
const { GanacheSubprovider } = require('@0x/subproviders');
const HDWalletProvider = require('truffle-hdwallet-provider');
const ProviderEngine = require('web3-provider-engine');
const { toWei, toHex } = require('web3-utils');

const compilerConfig = require('./compiler');

const addressIndexToManage = 1;
const numAddresses = 2;

let rinkebyProvider = {};
let mainnetProvider = {};
let ropstenProvider = {};

// You must specify a MNEMONIC and INFURA_API_KEY in your .env file
function createProvider(network) {
    if (process.env.CI && process.env.CIRCLE_JOB !== 'artifacts') {
        return {};
    }
    if (!process.env.MNEMONIC) {
        console.log('Please set a MNEMONIC in a .env file');
        process.exit(1);
    }
    if (!process.env.INFURA_API_KEY) {
        console.log('Please set your INFURA_API_KEY');
        process.exit(1);
    }
    return () => {
        return new HDWalletProvider(
            process.env.MNEMONIC,
            `https://${network}.infura.io/v3/` + process.env.INFURA_API_KEY,
            addressIndexToManage,
            numAddresses,
        );
    };
}

rinkebyProvider = createProvider('rinkeby');
mainnetProvider = createProvider('mainnet');
ropstenProvider = createProvider('ropsten');

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
engine.stop();

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
            provider: engine,
            gas: 10e6,
            gasPrice: toHex(toWei('1', 'gwei')),
            network_id: '*', // eslint-disable-line camelcase
            port: 8545,
        },
        mainnet: {
            provider: mainnetProvider,
            gas: 10e6,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '1',
            skipDryRun: true,
        },
        rinkeby: {
            provider: rinkebyProvider,
            gas: 10e6,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '4',
            skipDryRun: true,
        },
        ropsten: {
            provider: ropstenProvider,
            gas: 8e6,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '3',
            skipDryRun: true,
        },
    },
};
