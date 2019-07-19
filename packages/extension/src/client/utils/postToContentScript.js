import {
    clientEvent,
    contentEvent,
} from '~config/event';
import generateRandomId from '~utils/generateRandomId';

export default async function postToContentScript({
    query,
    mutation,
}) {
    const requestId = generateRandomId();

    return new Promise((resolve) => {
        const responseHandler = (event) => {
            const {
                type,
                responseId,
                response,
            } = event.data || {};
            if (type === contentEvent
                && responseId === requestId
            ) {
                window.removeEventListener('message', responseHandler, false);
                resolve(response);
            }
        };

        window.addEventListener('message', responseHandler, false);

        window.postMessage({
            type: clientEvent,
            requestId,
            query,
            mutation,
        }, '*');
    });
}
