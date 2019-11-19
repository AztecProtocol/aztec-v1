import {
    connectionRequestEvent,
    connectionApprovedEvent,
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
        if (event.data.type === connectionRequestEvent) {
            const {
                clientProfile,
            } = event.data;

            if (clientProfile && clientProfile.networkId) {
                response = await setupClientConfig(clientProfile);
            } else if (event.origin !== uiSourceOrigin) {
                return;
            }

            const channel = new MessageChannel();
            const {
                data,
            } = event;

            connection.registerClient({
                data,
                port: channel.port1,
            });

            event.source.postMessage({
                type: connectionApprovedEvent,
                code: '200',
                data: response,
            }, '*', [channel.port2]);
        }
    });
}
