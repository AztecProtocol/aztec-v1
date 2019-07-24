import {
    clientEvent,
    contentEvent,
} from '~config/event';

import {
    mergeMap,
    map,
    filter,
    catchError,
} from 'rxjs/operators';
import {
    from,
    fromEvent,
} from 'rxjs';
import fetchFromBackgroundScript from '../utils/fetchFromBackgroundScript';


export default function listenMessagesFromClient() {
    const source$ = fromEvent(window, 'message');
    source$.pipe(
        filter(({ data }) => data.type === clientEvent),
        mergeMap((event) => {
            const {
                type,
                requestId,
                ...data
            } = event.data || {};
            return from(fetchFromBackgroundScript({ type, ...data, requestId }));
        }),
        map(({data, requestId}) => {
            window.postMessage({
                type: contentEvent,
                responseId: requestId,
                response: data,
            }, '*');
        }),
    ).subscribe();
}
