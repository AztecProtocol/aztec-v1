import {
    mergeMap,
    map,
    filter,
} from 'rxjs/operators';
import {
    from,
    fromEvent,
} from 'rxjs';
import {
    clientEvent,
    clientSubscribeEvent,
    clientUnsubscribeEvent,
} from '~config/event';
import fetchFromBackgroundScript from '../utils/fetchFromBackgroundScript';
import subscribeToBackgroundScript from '../utils/subscribeToBackgroundScript';
import postToClientScript from '../utils/postToClientScript';

const isClientEvent = event => [
    clientSubscribeEvent,
    clientUnsubscribeEvent,
].indexOf(event.data.type) >= 0;

export default function listenMessagesFromClient() {
    const source$ = fromEvent(window, 'message');
    source$.pipe(
        filter(({ data }) => data.type === clientEvent),
        mergeMap(event => from(fetchFromBackgroundScript(event.data))),
        map(({ data, requestId }) => postToClientScript(requestId, data)),
    ).subscribe();

    const subscriptions = new Map();
    window.addEventListener('message', (event) => {
        if (!isClientEvent(event)) return;

        const {
            type,
            requestId,
        } = event.data;

        if (type === clientUnsubscribeEvent) {
            const subscription = subscriptions.get(requestId);
            subscriptions.delete(requestId);
            if (subscription) {
                subscription.unsubscribe();
            }
            return;
        }

        const subscription = subscribeToBackgroundScript(event.data);
        subscriptions.set(requestId, subscription);
    });
}
