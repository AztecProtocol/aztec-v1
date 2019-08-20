import browser from 'webextension-polyfill';
import {
    clientEvent,
    contentSubscribeEvent,
    contentUnsubscribeEvent,
} from '~config/event';
import Connection from '../utils/connection.js';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';

const handleContentScriptSubscription = (data, port) => {
    const {
        type,
    } = data;

    switch (type) {
        case contentSubscribeEvent:
            ClientSubscriptionService.subscribe(port);
            port.onDisconnect.addListener(p => ClientSubscriptionService.unsubscribe(p));
            break;
        case contentUnsubscribeEvent:
            ClientSubscriptionService.unsubscribe(port);
            port.onMessage.removeListener(handleContentScriptSubscription);
            port.disconnect();
            break;
        default:
    }
};

export default function acceptConnection() {
    const connection = new Connection();

    browser.runtime.onMessage.addListener(async (msg, sender) => {
        switch (msg.type) {
            case clientEvent: {
                return connection.handleMessage({ data: msg, sender });
            }
            case 'UI_CONFIRM': {
                connection.UiEventSubject.next(msg, sender);
                break;
            }
            case 'UI_REJECTION': {
                connection.UiEventSubject.next(msg, sender);
                break;
            }
            default:
        }
        return null;
    });

    browser.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener(handleContentScriptSubscription);
    });
}
