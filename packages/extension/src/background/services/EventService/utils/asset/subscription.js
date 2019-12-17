import Web3Service from '~/helpers/Web3Service';
import {
    ACE,
} from '~/config/contractEvents';
import {
    errorLog,
} from '~/utils/log';

const converEvent = (event) => {
    const {
        blockNumber,
        returnValues: {
            registryOwner,
            registryAddress,
            scalingFactor,
            linkedTokenAddress,
            canAdjustSupply,
            canConvert,
        },
    } = event;

    return {
        blockNumber,
        registryOwner,
        registryAddress,
        scalingFactor,
        linkedTokenAddress,
        canAdjustSupply,
        canConvert,
    };
};

const subscribe = async ({
    fromBlock,
} = {}) => {
    const eventName = ACE.сreateNoteRegistry;

    const options = {
        fromBlock,
    };

    const subscription = await Web3Service
        .useContract('ACE')
        .events(eventName)
        .subscribe(options, (error) => {
            if (error) {
                errorLog(error);
            }
        });

    return {
        subscription,
        onData: (callback) => {
            subscription.on('data', (event) => {
                callback(converEvent(event));
            });
        },
        onError: (callback) => {
            subscription.on('error', (error) => {
                callback(error);
            });
        },
    };
};

export default {
    subscribe,
};
