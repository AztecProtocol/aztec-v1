import {
    clientEvent,
    contentEvent,
} from '~config/event';

import {
    mergeMap,
    map,
    filter,
} from 'rxjs/operators';
import {
    from, fromEvent,
} from 'rxjs';
import fetchFromBackgroundScript from '../utils/fetchFromBackgroundScript';


export default function listenMessagesFromClient() {
    const source = fromEvent(window, 'message');
    // TODO this could be an RXJS stream
    // as we get messages we need to await the stream and process the incoming messages chronoligically
    // the content script runs once per page so multiple threads will run if the extension is active on multiple tabs
    // the states are as follows
    // success -> the message could be completed without any ui prompts
    // error -> the message failed with an error that is not due to permisioning
    // requiresLogin -> a valid session is needed to perform this action
    // requiresAssetPermisio -> the user needs to grant the domain access to the asset
    // requiresAZTECAccount -> the user need to register the extension to proceed.
    source.pipe(
        filter(({ data }) => data.type === clientEvent),
        mergeMap((event) => {
            const {
                type,
                requestId,
                ...data
            } = event.data || {};
            return from(fetchFromBackgroundScript({ type, ...data, requestId }));
        }),
        map(({ data, requestId }) => {
            const error = !!data && data.error;
            window.postMessage({
                type: contentEvent,
                responseId: requestId,
                response: data,
            }, '*');
        }),
    )
        .subscribe();
}
