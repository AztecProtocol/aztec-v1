import {
    clientEvent,
    contentEvent,
} from '~config/event';
import generateRandomId from '~utils/generateRandomId';

export default async function postToContentScript(data, cb) {
    const requestId = generateRandomId();

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
