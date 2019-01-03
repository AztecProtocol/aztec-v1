require('dotenv').config();
const { toWei, toHex } = require('web3-utils');
const HDWalletProvider = require('truffle-hdwallet-provider');

function createProvider(infuraUrl) {
    if (!process.env.MNEMONIC || !process.env.INFURA_API_KEY) {
        console.log('Please load your MNEMONIC and INFURA_API_KEY in a .env file');
        process.exit(1);
    }
    return () => {
        return new HDWalletProvider(process.env.MNEMONIC, infuraUrl + process.env.INFURA_API_KEY);
    };
}

module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    compilers: {
        solc: {
            version: '0.4.24',
            settings: {
                optimizer: {
                    enabled: true,
                    runs: 200,
                },
            },
        },
    },
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545, // default port for ganachi-cli
            network_id: '*', // Match any network id
        },
        kovan: {
            provider: createProvider('https://kovan.infura.io/'),
            gas: 4600000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '42',
        },
        mainnet: {
            provider: createProvider('https://mainnet.infura.io/'),
            gas: 6000000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '1',
        },
        rinkeby: {
            provider: createProvider('https://rinkeby.infura.io/'),
            gas: 4700000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '4',
        },
        ropsten: {
            provider: createProvider('https://ropsten.infura.io'),
            gas: 4600000,
            gasPrice: toHex(toWei('10', 'gwei')),
            network_id: '3',
        },
    },
};
