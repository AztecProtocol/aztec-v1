import {
    clientEvent,
    contentEvent,
} from '~config/event';


import fetchFromBackgroundScript from '../utils/fetchFromBackgroundScript';

export default function listenMessagesFromClient() {
    window.addEventListener('message', async (event) => {
        // TODO
        // check permission in storage
        //   x -> return special response to client script to request user authorization
        //   o -> delegate the query to background script
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
                console.log(response.errorMessage);
                // await handleError(response.errorMessage, data);
                // pause while handle error
                window.postMessage({
                    type: contentEvent,
                    responseId: requestId,
                    error: true,
                    errorMessage: response.errorMessage,
                }, '*');
            }
        }
    });
}
