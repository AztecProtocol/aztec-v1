import {
    connectionRequestEvent,
    connectionApprovedEvent,
    backgroundReadyEvent,
    uiCloseEvent,
} from '~/config/event';
import urls from '~/config/urls';
import Connection from '../utils/connection';
import setupNetworkConfig from './setupNetworkConfig';

const {
    origin: uiSourceOrigin,
} = new URL(urls.ui);

export default function acceptConnection() {
    window.parent.postMessage({
        type: backgroundReadyEvent,
    }, '*');

    const connection = Connection;
    let networkConfig;

    window.addEventListener('message', async (event) => {
        if (event.data.type === connectionRequestEvent) {
            const {
                clientProfile,
            } = event.data;

            if (clientProfile && clientProfile.networkId) {
                networkConfig = await setupNetworkConfig(clientProfile);
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
                data: networkConfig,
            }, '*', [channel.port2]);
        }
    });

    window.addEventListener(uiCloseEvent, (e) => {
        const {
            detail,
        } = e;
        connection.abortUi(detail);
    });
}
