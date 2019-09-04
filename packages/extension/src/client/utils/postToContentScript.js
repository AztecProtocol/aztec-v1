import {
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
                response,
            } = event.data || {};

            if (type === contentEvent
                && event.data.requestId === requestId
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
            requestId,
        }, '*');
    });
}
