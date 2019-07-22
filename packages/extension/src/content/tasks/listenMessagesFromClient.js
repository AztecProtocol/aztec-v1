import {
    clientEvent,
    contentEvent,
} from '~config/event';
import fetchFromBackgroundScript from '../utils/fetchFromBackgroundScript';

export default function listenMessagesFromClient() {
    window.addEventListener('message', async (event) => {
        const {
            type,
            requestId,
            ...data
        } = event.data || {};

        // TODO this could be an RXJS stream

        if (type === clientEvent) {
            const response = await fetchFromBackgroundScript(data);
            if (!response.error) {
                window.postMessage({
                    type: contentEvent,
                    responseId: requestId,
                    response,
                }, '*');
            } else {
                // await handleError(response.errorMessage, data);
                // pause while handle error
                window.postMessage({
                    type: contentEvent,
                    responseId: requestId,
                    response,
                }, '*');
            }
        }
    });
}
