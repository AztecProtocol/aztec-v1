import browser from 'webextension-polyfill';
import {
    contentSubscribeEvent,
    contentUnsubscribeEvent,
} from '~config/event';
import Connection from '../utils/connection';
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

    browser.runtime.onConnect.addListener((port) => {
        connection.registerClient(port);
        port.onMessage.addListener(handleContentScriptSubscription);
        port.onDisconnect.addListener(connection.removeClient);
    });
}
