import {
    clientEvent,
    contentEvent,
} from '~config/event';
import generateRandomId from '~utils/generateRandomId';

export default async function fetchFromContentScript(data = {}) {
    const requestId = generateRandomId();

    return new Promise((resolve) => {
        window.addEventListener('message', (event) => {
            if (event.data.type === contentEvent
                && event.data.responseId === requestId
            ) {
                console.log('client got response:', event);
                resolve(event.data.response);
            }
        }, false);

        window.postMessage({
            type: clientEvent,
            requestId,
            ...data,
        }, '*');
    });
}
