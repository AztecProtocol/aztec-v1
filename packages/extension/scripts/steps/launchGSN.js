import Web3 from 'web3';

import {
    DEFAULT_GSN_RELAYER_PORT,
} from '../config/constants';

import gsn from '../tasks/gsn/launch';

import '../../env';
import ganacheConfig from '../../config/ganache';
import getNetwork from '../utils/getNetwork';

import {
    argv,
} from '../utils/cmd';

async function defaultFromAccount(web3) {
    try {
        const accounts = await web3.eth.getAccounts();
        return accounts[0];
    } catch (error) {
        throw Error(`Failed to retrieve accounts: ${error}`);
    }
}

const network = getNetwork();

const defaultPort = 8545;

export const getPort = (fallbackPort = defaultPort) => {
    let port = argv('port');
    if (!port) {
        ({
            port,
        } = (ganacheConfig.networks || {})[network] || {});
    }

    return port || fallbackPort;
};

export const getHost = () => {
    const {
        host = 'localhost',
    } = (ganacheConfig.networks || {})[network] || {};

    return `http://${host}`;
};


export default async function launchGSN() {
    if (process.env.SERVE_LOCATION) {
        return {
            kill: () => {},
        };
    }
    const relayUrl = `${getHost()}:${DEFAULT_GSN_RELAYER_PORT}`;
    const port = getPort(0);
    const host = getHost();
    const providerUrl = `${host}:${port}`;
    const provider = new Web3.providers.HttpProvider(providerUrl);
    const web3 = new Web3(provider);
    const from = await defaultFromAccount(web3);

    return gsn.launch([
        '--relayUrl', relayUrl,
        '--ethereumNodeURL', providerUrl,
        '-f', from,
        '--workdir', gsn.cwd,
    ]);
}
