import {
    clientEvent,
    contentEvent,
} from '~config/event';
import fetchFromBackgroundScript from '../utils/fetchFromBackgroundScript';

export default function listenMessagesFromClient() {
    window.addEventListener('message', async (event) => {
        // TODO
        // check permission in storage
        //   x -> return special response to for client script to request user authorization
        //   o -> delegate the query to background script
        const {
            type,
            requestId,
            ...data
        } = event.data || {};

        if (type === clientEvent) {
            const response = await fetchFromBackgroundScript(data);
            window.postMessage({
                type: contentEvent,
                responseId: requestId,
                response,
            }, '*');
        }
    });
}
