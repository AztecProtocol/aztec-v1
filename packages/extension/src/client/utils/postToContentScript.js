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
        window.addEventListener('message', (event) => {
            const {
                type,
                responseId,
                response,
            } = event.data || {};
            if (type === contentEvent
                && responseId === requestId
            ) {
                resolve(response);
            }
        }, false);

        window.postMessage({
            type: clientEvent,
            requestId,
            query,
            mutation,
        }, '*');
    });
}
