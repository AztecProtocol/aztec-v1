import path from 'path';
import Web3 from 'web3';
import instance from '../utils/instance';
import '../../env';
import {
    getHost,
    getPort,
} from './ganacheInstance';
import {
    errorLog,
} from '../utils/log';
import {
    defaultFromAccount,
} from '../utils/GNSHelpers';
import {
    DEFAULT_GSN_RELAYER_PORT,
} from '../config/constants';


const killedSig = '137';

export default async function gsnRelayerInstance({
    config = {},
    onError,
    onClose,
} = {}) {
    const port = getPort(0);
    const host = getHost();
    const providerUrl = `${host}:${port}`;
    const provider = new Web3.providers.HttpProvider(providerUrl);
    const web3 = new Web3(provider);
    const from = await defaultFromAccount(web3);
    const {
        relayerPort = DEFAULT_GSN_RELAYER_PORT,
        workdir = path.resolve(__dirname, '../../build/gsn'),
    } = config;

    const relayUrl = `${host}:${relayerPort}`;

    const exitOnError = () => {
        if (onError) {
            onError();
        }
        if (onClose) {
            onClose();
        }
    };

    const handleReceiveOutput = (output) => {
        if (output.includes('exited with code')) {
            const [, code] = output.match(/exited with code ([0-9]+)/) || [];
            if (code !== killedSig) {
                errorLog(`✖ GSN Relayer exited with code ${code}`);
            }
            exitOnError();
        } else {
            process.stdout.write(output);
        }
    };

    const runRelayerCMD = `npx oz-gsn run-relayer --detach --quiet --relayUrl "${relayUrl}" --ethereumNodeURL "${providerUrl}" -f "${from}" --workdir "${workdir}"`;
    return instance(
        runRelayerCMD,
        {
            shouldStart: output => output.includes('Relay is funded and ready!'),
            onReceiveOutput: handleReceiveOutput,
            onError,
            onClose,
            handleStderrAsNormalOutput: true,
        },
    );
}
