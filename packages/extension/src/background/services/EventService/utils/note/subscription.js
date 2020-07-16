import Web3 from 'web3';
import Web3Service from '~/helpers/Web3Service';
import {
    ZkAsset,
} from '~/config/contracts';
import {
    errorLog,
} from '~/utils/log';
import decodeNoteLogs from './helpers/decodeNoteLogs';
import { getProviderUrl } from '~/utils/network';

const subscribe = async ({
    owner,
    fromBlock,
    networkId,
    fromAssets = null,
} = {}) => {
    if (!networkId) {
        errorLog("'networkId' cannot be empty in assets subscription");
        return null;
    }

    const provider = getProviderUrl(Web3Service.networkId, true);
    const { abi, subscribe: subscribeOn } = new Web3(provider).eth;

    const eventsTopics = [
        ZkAsset.events.createNote,
        ZkAsset.events.destroyNote,
        ZkAsset.events.updateNoteMetaData,
    ]
        .map(e => ZkAsset.config.abi.find(({ name, type }) => name === e && type === 'event'))
        .map(abi.encodeEventSignature);

    const ownerTopics = owner ? abi.encodeParameter('address', owner) : null;

    const options = {
        fromBlock,
        address: fromAssets,
        topics: [
            eventsTopics,
            ownerTopics,
        ],
    };

    const subscription = subscribeOn('logs', options, (error) => {
        if (error) {
            errorLog(error);
        }
    });

    return {
        subscription,
        onData: (callback) => {
            subscription.on('data', (event) => {
                const decodedLogs = decodeNoteLogs(eventsTopics, [event], networkId);
                callback(decodedLogs);
            });
        },
        onError: (callback) => {
            subscription.on('error', (error) => {
                callback(error);
            });
        },
    };
};

const unsubscribe = async (subscription) => {
    try {
        await new Promise((resolve, reject) => {
            subscription.unsubscribe((error, success) => {
                if (success) {
                    resolve();
                } else {
                    reject(error);
                }
            });
        });
        return {
            error: null,
            subscription,
        };
    } catch (error) {
        return {
            error,
            subscription,
        };
    }
};

export default {
    subscribe,
    unsubscribe,
};
