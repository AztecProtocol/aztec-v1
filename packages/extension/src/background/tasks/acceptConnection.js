import {
    backgroundReadyEvent,
} from '~/config/event';
import urls from '~/config/urls';
import Connection from '../utils/connection';
import setupClientConfig from './setupClientConfig';

const {
    origin: uiSourceOrigin,
} = new URL(urls.ui);

export default function acceptConnection() {
    window.parent.postMessage({
        type: backgroundReadyEvent,
    }, '*');

    const connection = new Connection();
    let response;

    window.addEventListener('message', async (event) => {
        if (event.data.type === 'aztec-connection') {
            const {
                data: clientData,
            } = event.data;

            if (clientData && clientData.networkId) {
                response = await setupClientConfig(clientData);
            } else if (event.origin !== uiSourceOrigin) {
                return;
            }

            const channel = new MessageChannel();
            const {
                data,
            } = event;

            event.source.postMessage({
                type: 'aztec-connection',
                code: '200',
                response,
            }, '*', [channel.port2]);

            connection.registerClient({
                data,
                port: channel.port1,
            });
        }
    });
}
