import {
    clientSubscribeEvent,
    clientUnsubscribeEvent,
    contentEvent,
} from '~config/event';
import insertVariablesToGql from '~utils/insertVariablesToGql';
import {
    randomId,
} from '~utils/random';
import Web3Service from '../services/Web3Service';

export default function subscribeToContentScript(queryStr, cb) {
    const requestId = randomId();

    const responseHandler = (event) => {
        const {
            type,
            responseId,
            response,
        } = event.data || {};

        if (type === contentEvent
            && responseId === requestId
        ) {
            cb(response);
        }
    };

    window.addEventListener('message', responseHandler, false);

    const {
        address = '',
    } = Web3Service.account || {};

    const query = insertVariablesToGql(
        queryStr,
        {
            currentAddress: address.toLowerCase(),
        },
    );

    window.postMessage({
        type: clientSubscribeEvent,
        requestId,
        query,
    }, '*');

    return {
        requestId,
        unsubscribe: () => {
            window.removeEventListener('message', responseHandler, false);
            window.postMessage({
                type: clientUnsubscribeEvent,
                requestId,
            }, '*');
        },
    };
}
