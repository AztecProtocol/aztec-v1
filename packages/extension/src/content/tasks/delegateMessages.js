import {
    clientEvent,
    contentEvent,
} from '~config/event';
import fetchFromBackgroundScript from '../utils/fetchFromBackgroundScript';

export default function delegateMessages() {
    window.addEventListener('message', async (event) => {
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
