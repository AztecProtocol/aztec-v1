import isEqual from 'lodash/isEqual';
import {
    clientEvent,
} from '~config/event';
import fetchFromBackgroundScript from './fetchFromBackgroundScript';
import postToClientScript from './postToClientScript';
import delay from './delay';

export default function subscribeToBackgroundScript(data, interval = 1000) {
    let subscribing = true;
    let prevResponse = {};

    const subscribe = async () => {
        const returnData = await fetchFromBackgroundScript({
            ...data,
            type: clientEvent,
        }) || {};

        const {
            requestId,
            data: response,
        } = returnData;
        if (!isEqual(response, prevResponse)) {
            const failedQuery = Object.keys(response)
                .find(queryName => !!response[queryName].error);

            if (!failedQuery) {
                postToClientScript(requestId, response);
                prevResponse = response;
            }
        }

        await delay(interval);
        if (subscribing) {
            subscribe();
        }
    };

    subscribe();

    return {
        unsubscribe: () => {
            subscribing = false;
        },
    };
}
