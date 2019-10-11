import {
    mergeMap,
    map,
    filter,
    tap,
} from 'rxjs/operators';
import {
    fromEvent,
    from,
    Subject,
} from 'rxjs';
import browser from 'webextension-polyfill';
import {
    clientEvent,
    actionEvent,
    clientUnsubscribeEvent,
    clientSubscribeEvent,
} from '~config/event';
import filterStream from '~utils/filterStream';
import subscribeToBackgroundScript from '../utils/subscribeToBackgroundScript';
import { randomId } from '~utils/random';
import postToClientScript from '../utils/postToClientScript';

const isClientEvent = event => [
    clientSubscribeEvent,
    clientUnsubscribeEvent,
].indexOf(event.data.type) >= 0;


function getSiteName(window) {
    const document = window.document;
    const siteName = document.querySelector('head > meta[property="og:site_name"]');
    if (siteName) {
        return siteName.content;
    }

    const siteTitle = document.querySelector('head > meta[property="og:title"]');
    if (siteTitle) {
        return siteTitle.content;
    }

    const metaTitle = document.querySelector('head > meta[name="title"]');
    if (metaTitle) {
        return metaTitle.content;
    }

    return document.title;
}

/**
 * Extracts an icon for the site from the DOM
 */
function getSiteIcon(window) {
    const document = window.document;

    // Use the site's favicon if it exists
    const shortcutIcon = document.querySelector('head > link[rel="shortcut icon"]');
    if (shortcutIcon) {
        return shortcutIcon.href;
    }

    // Search through available icons in no particular order
    const icon = Array.from(document.querySelectorAll('head > link[rel="icon"]')).find(icon => Boolean(icon.href));
    if (icon) {
        return icon.href;
    }

    return null;
}

export default function listenMessagesFromClient() {
    const clientId = randomId();
    const backgroundPort = browser.runtime.connect({
        name: clientId,
    });
    const backgroundSubject = new Subject();
    const background$ = backgroundSubject.asObservable();

    backgroundPort.onMessage.addListener((msg, sender) => {
        backgroundSubject.next(msg);
    });

    let metadata;


    const source$ = fromEvent(window, 'message');
    source$.pipe(
        filter(({ data }) => data.type === 'ACTION_RESPONSE'),
        tap(event => backgroundPort.postMessage(event.data)),
    ).subscribe();

    // here we handle messages from the client page
    source$.pipe(
        filter(({ data }) => data.type === clientEvent),
        // and wait for a response that has a matching requestId
        tap((event) => {
            if (!metadata) {
                metadata = {
                    name: getSiteName(window),
                    icon: getSiteIcon(window),
                };
            }
            backgroundPort.postMessage({
                metadata,
                ...event.data,
            });
        }),
        mergeMap(event => from(filterStream('CLIENT_RESPONSE', event.data.requestId, background$))),
        map(({ requestId, response }) => postToClientScript(requestId, response)),
    ).subscribe();


    // here we handle metamask interaction requests
    background$.pipe(
        filter(({ type }) => type === actionEvent),
        tap(event => window.postMessage({
            type: actionEvent,
            requestId: event.data.requestId,
            response: event.data,
        })),
        // mergeMap(event => from(filterStream('ACTION_RESPONSE', event.data.requestId, source$))),
    ).subscribe();

    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //
    //

    const subscriptions = new Map();
    window.addEventListener('message', async (event) => {
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

        const subscription = await subscribeToBackgroundScript(event.data);
        if (subscription) {
            subscriptions.set(requestId, subscription);
        }
    });
}
