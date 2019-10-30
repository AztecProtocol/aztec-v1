import {
    backgroundReadyEvent,
} from '~config/event';
import Connection from '../utils/connection';

export default function acceptConnection() {
    window.parent.postMessage({
        type: backgroundReadyEvent,
    }, '*');

    const connection = new Connection();

    window.addEventListener('message', (event) => {
        if (event.data.type === 'aztec-connection') {
            const channel = new MessageChannel();
            const {
                data,
            } = event;

            event.source.postMessage({
                type: 'aztec-connection',
                code: '200',
            }, '*', [channel.port2]);

            connection.registerClient({
                data,
                port: channel.port1,
            });
        }
    });
}
