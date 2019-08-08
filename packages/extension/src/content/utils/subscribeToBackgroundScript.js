import browser from 'webextension-polyfill';
import {
    clientEvent,
    contentSubscribeEvent,
    contentUnsubscribeEvent,
} from '~config/event';
import insertVariablesToGql from '~utils/insertVariablesToGql';
import fetchFromBackgroundScript from './fetchFromBackgroundScript';
import postToClientScript from './postToClientScript';

export default async function subscribeToBackgroundScript(data) {
    const {
        requestId,
        query,
    } = data;

    const queryWithRequestId = insertVariablesToGql(
        query,
        {
            requestId,
        },
    );

    const backgroundResponse = await fetchFromBackgroundScript({
        ...data,
        type: clientEvent,
        query: queryWithRequestId,
    }) || {};
    const {
        data: {
            validation,
        },
    } = backgroundResponse;

    if (!validation.success) {
        return null;
    }

    const port = browser.runtime.connect({ name: requestId });
    port.onMessage.addListener(response => postToClientScript(requestId, {
        response,
    }));

    port.postMessage({
        type: contentSubscribeEvent,
    });

    const unsubscribe = () => port.postMessage({
        type: contentUnsubscribeEvent,
    });

    return {
        unsubscribe,
    };
}
