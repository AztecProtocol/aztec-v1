const WalletProvider = require('truffle-wallet-provider');
const Wallet = require('ethereumjs-wallet');
const { toWei } = require('web3-utils');

// when deploying to a non-development network, add the private key of wallet being used into 'privateKeys.json'
const accounts = require('./accounts');

const keys = accounts.keys || [{ public: '', private: '' }];

const wallet = Wallet.fromPrivateKey(Buffer.from(keys[0].private.slice(2), 'hex'));
const rinkebyProvider = new WalletProvider(wallet, 'https://rinkeby.infura.io/FPuvsFyuZmA7p9xKUc9Q');
const ropstenProvider = new WalletProvider(wallet, 'https://ropsten.infura.io/FPuvsFyuZmA7p9xKUc9Q');
const mainNetProvider = new WalletProvider(wallet, 'https://mainnet.infura.io/FPuvsFyuZmA7p9xKUc9Q');
const kovanProvider = new WalletProvider(wallet, 'https://kovan.infura.io/FPuvsFyuZmA7p9xKUc9Q');


module.exports = {
    // See <http://truffleframework.com/docs/advanced/configuration>
    // to customize your Truffle configuration!
    networks: {
        development: {
            host: '127.0.0.1',
            port: 8545, // default port for ganachi-cli
            network_id: '*', // Match any network id
        },
        rinkeby: {
            provider: rinkebyProvider,
            gas: 4600000,
            gasPrice: toWei('10', 'gwei'),
            network_id: '4',
        },
        mainNet: {
            provider: mainNetProvider,
            gas: 4600000,
            gasPrice: toWei('10', 'gwei'),
            network_id: '1',
        },
        ropsten: {
            provider: ropstenProvider,
            gas: 4600000,
            gasPrice: toWei('10', 'gwei'),
            network_id: '3',
        },
        kovan: {
            provider: kovanProvider,
            gas: 4600000,
            gasPrice: toWei('10', 'gwei'),
            network_id: '42',
        },
    },
};
