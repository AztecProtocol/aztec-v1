import {
    clientEvent,
    contentEvent,
} from '~config/event';
import {
    randomId,
} from '~utils/random';

export default async function postToContentScript(data, cb) {
    const requestId = randomId();

    return new Promise((resolve) => {
        const responseHandler = async (event) => {
            const {
                type,
                responseId,
                response,
            } = event.data || {};

            if (type === contentEvent
                && responseId === requestId
            ) {
                window.removeEventListener('message', responseHandler, false);
                const result = cb
                    ? await cb(response)
                    : response;
                resolve(result);
            }
        };

        window.addEventListener('message', responseHandler, false);

        window.postMessage({
            ...data,
            type: clientEvent,
            requestId,
        }, '*');
    });
}
