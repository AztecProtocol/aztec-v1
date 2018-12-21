/**
 * Exposes a web3 object with the required websocket provider. Will automatically re-open connection if closed.
 *
 * @module web3Listener
 */

const Web3 = require('web3');

const config = require('./config');

const web3 = new Web3(config.provider);

const listen = () => {
    const provider = new Web3.providers.WebsocketProvider(config.provider);
    provider.on('connect', () => {
        console.log('web3 connected');
    });
    provider.on('error', () => {
        console.error('WS Error');
        listen();
    });
    provider.on('end', () => {
        console.log('WS Closed');
        listen();
    });
    web3.setProvider(provider);
};

if (config.env !== 'NONE') {
    listen();
}

module.exports = web3;
