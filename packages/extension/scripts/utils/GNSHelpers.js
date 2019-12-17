import http from 'http';
import {
    utils,
} from 'web3';
import {
    log,
    errorLog,
} from './log';
import {
    DEFAULT_GSN_RELAYER_PORT,
} from '../config/constants';

export const defaultRelayerURL = `http://localhost:${DEFAULT_GSN_RELAYER_PORT}`;

export const ether = value => new utils.BN(utils.toWei(value, 'ether'));

export const defaultFromAccount = async (web3) => {
    try {
        const accounts = await web3.eth.getAccounts();
        return accounts[0];
    } catch (error) {
        throw Error(`Failed to retrieve accounts: ${error}`);
    }
};

export const isRelayReady = async relayUrl => new Promise((resolve, reject) => {
    http.get(`${relayUrl}/getaddr`, (resp) => {
        let data = '';
        resp.on('data', (chunk) => {
            data += chunk;
        });
        resp.on('end', () => {
            const isReady = (JSON.parse(data) || {}).Ready;
            log(`Is GSN Relayer ready: ${isReady}`);
            resolve(isReady);
        });
    }).on('error', (err) => {
        errorLog(`Error: ${err.message}`);
        reject(err);
    });
});

export const waitForRelay = async (relayUrl) => {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

    const timeout = 30;
    log(`Will wait up to ${timeout}s for the relay to be ready`);

    for (let i = 0; i < timeout; i += 1) {
        // eslint-disable-next-line no-await-in-loop
        await sleep(1000);
        // eslint-disable-next-line no-await-in-loop
        const isReady = await isRelayReady(relayUrl);
        if (isReady) {
            return;
        }
    }
    throw Error(`Relay not ready after ${timeout}s`);
};
