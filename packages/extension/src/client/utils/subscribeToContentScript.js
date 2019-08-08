import {
    clientSubscribeEvent,
    clientUnsubscribeEvent,
    contentEvent,
} from '~config/event';
import {
    randomId,
} from '~utils/random';
import Web3Service from '../services/Web3Service';

export default function subscribeToContentScript(options, cb) {
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
    const {
        entity,
        type,
        assetId,
        noteId,
    } = options;

    const query = `
        validation: subscribe(
            type: "${entity.toUpperCase()}_${type.toUpperCase()}",
            assetId: "${assetId || ''}",
            noteId: "${noteId || ''}",
            currentAddress: "${address.toLowerCase()}"
        ) {
            success
            error {
                type
                key
                message
                response
            }
        }
    `;

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
