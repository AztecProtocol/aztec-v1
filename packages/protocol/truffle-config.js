/* eslint-disable func-names */
/* eslint-disable object-shorthand */
require('dotenv').config();
const { CoverageSubprovider } = require('@0x/sol-coverage');
const { ProfilerSubprovider } = require('@0x/sol-profiler');
const { RevertTraceSubprovider, TruffleArtifactAdapter } = require('@0x/sol-trace');
const { GanacheSubprovider } = require('@0x/subproviders');
const HDWalletProvider = require('truffle-hdwallet-provider');
const Web3 = require('web3');
const ProviderEngine = require('web3-provider-engine');
const { toWei, toHex } = require('web3-utils');

const compilerConfig = require('./compiler');

// Get the address of the first account in Ganache
async function getFirstAddress() {
    const web3 = new Web3(new Web3.providers.HttpProvider('http://localhost:8545'));
    const addresses = await web3.eth.getAccounts();
    return addresses[0];
}

// You must specify PRIVATE_KEY and INFURA_API_KEY in your .env file
// Feel free to replace PRIVATE_KEY with a MNEMONIC to use an hd wallet
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
            process.env.PRIVATE_KEY || process.env.MNEMONIC,
            `https://${network}.infura.io/v3/` + process.env.INFURA_API_KEY,
        );
    };
}

let rinkebyProvider = {};
let mainnetProvider = {};
let ropstenProvider = {};

const projectRoot = '';
const isVerbose = true;
const coverageSubproviderConfig = {
    isVerbose,
    ignoreFilesGlobs: ['**/Migrations.sol', '**/node_modules/**', '**/interfaces/**', '**/test/**'],
};
const artifactAdapter = new TruffleArtifactAdapter(projectRoot, compilerConfig.solcVersion);
const engine = new ProviderEngine();

let defaultFromAddress;
const testModes = ['profile', 'coverage', 'trace'];
if (testModes.includes(process.env.MODE)) {
    defaultFromAddress = getFirstAddress();
}

switch (process.env.MODE) {
    case 'profile':
        global.profilerSubprovider = new ProfilerSubprovider(artifactAdapter, defaultFromAddress, isVerbose);
        engine.addProvider(global.profilerSubprovider);
        break;
    case 'coverage':
        global.coverageSubprovider = new CoverageSubprovider(artifactAdapter, defaultFromAddress, coverageSubproviderConfig);
        engine.addProvider(global.coverageSubprovider);
        break;
    case 'trace':
        engine.addProvider(new RevertTraceSubprovider(artifactAdapter, defaultFromAddress, isVerbose));
        break;
    default:
        rinkebyProvider = createProvider('rinkeby');
        mainnetProvider = createProvider('mainnet');
        ropstenProvider = createProvider('ropsten');
        break;
}

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
        test: {
            provider: new Web3.providers.HttpProvider('http://localhost:8545'),
            gas: 6500000,
            gasPrice: toHex(toWei('1', 'gwei')),
            network_id: '*', // eslint-disable-line camelcase
            port: 8545,
        },
        development: {
            provider: engine,
            gas: 6500000,
            gasPrice: toHex(toWei('1', 'gwei')),
            network_id: '*', // eslint-disable-line camelcase
            port: 8545,
        },
        mainnet: {
            provider: mainnetProvider,
            gas: 9e6,
            gasPrice: toHex(toWei('15', 'gwei')),
            network_id: '1',
            skipDryRun: true,
        },
        rinkeby: {
            provider: rinkebyProvider,
            gas: 9e6,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '4',
            skipDryRun: true,
        },
        ropsten: {
            provider: ropstenProvider,
            gas: 7e6,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '3',
            skipDryRun: true,
        },
    },
};
