import {
    connectionRequestEvent,
    connectionApprovedEvent,
    backgroundReadyEvent,
    uiCloseEvent,
} from '~/config/event';
import {
    getResourceUrl,
} from '~/utils/versionControl';
import {
    permissionError,
} from '~/utils/error';
import {
    errorLog,
} from '~/utils/log';
import Connection from '../utils/connection';
import migrateIndexedDB from './migrateIndexedDB';
import setupNetworkConfig from './setupNetworkConfig';

const resourceOrigin = getResourceUrl('origin');

export default function acceptConnection() {
    window.parent.postMessage({
        type: backgroundReadyEvent,
    }, '*');

    const connection = new Connection();
    let networkConfig;

    window.addEventListener('message', async (event) => {
        if (event.data.type === connectionRequestEvent) {
            const {
                requestId,
                clientProfile,
            } = event.data;

            if (clientProfile) {
                try {
                    // await migrateIndexedDB();
                    networkConfig = await setupNetworkConfig(clientProfile);
                    connection.initUi();
                } catch (e) {
                    const error = e.code === 4001
                        ? permissionError('user.denied.auth')
                        : e;
                    networkConfig = {
                        error,
                    };
                }
            } else if (event.origin !== resourceOrigin) {
                errorLog(`Invalid origin '${event.origin}'. Events can only be sent from '${resourceOrigin}'.`);
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
                requestId,
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
