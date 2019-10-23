import {
    contentSubscribeEvent,
    clientEvent,
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

    window.addEventListener('message', (event) => {
        if (event.data.type === 'aztec-connection') {
            const channel = new MessageChannel();
            event.source.postMessage({
                type: 'aztec-connection',
                code: '200',
            }, event.origin, [channel.port2]);
            const { data, origin } = event;
            connection.registerClient({
                data,
                origin,
                port: channel.port1,
            });
        }
        // port.onMessage.addListener(handleContentScriptSubscription);
        // port.onDisconnect.addListener(connection.removeClient);
    });
}
