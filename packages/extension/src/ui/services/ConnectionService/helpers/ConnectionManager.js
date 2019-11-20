import {
    connectionRequestEvent,
    connectionApprovedEvent,
    uiReadyEvent,
} from '~/config/event';
import {
    warnLog,
} from '~utils/log';
import {
    randomId,
} from '~utils/random';
import LRU from '~utils/caches/LRU';
import NetworkService from '~/helpers/NetworkService/factory';

class ConnectionManager {
    constructor({
        maxActiveResponses = 50,
    } = {}) {
        this.port = null;
        this.portId = '';
        this.callbacks = {};
        this.portResponses = new LRU(maxActiveResponses);
        this.clientRequestId = '';
    }

    async openConnection() {
        if (this.port) {
            warnLog('Connection has been established.');
            return null;
        }

        window.parent.postMessage({
            type: uiReadyEvent,
        }, '*');

        this.portId = randomId();

        const promise = new Promise((resolve) => {
            const handleReceiveMessage = (e) => {
                if (e.data.type === connectionApprovedEvent) {
                    const {
                        data,
                    } = e.data;
                    NetworkService.setConfigs([data]);

                    [this.port] = e.ports;
                    this.port.onmessage = this.handlePortResponse;
                    window.removeEventListener('message', handleReceiveMessage);
                    resolve();
                }
            };

            window.addEventListener('message', handleReceiveMessage);
        });

        window.parent.postMessage({
            type: connectionRequestEvent,
            requestId: randomId(),
            clientId: this.portId,
            sender: 'UI_CLIENT',
        });

        return promise;
    }

    setDefaultClientRequestId(clientRequestId) {
        if (this.clientRequestId) {
            warnLog(`clientRequestId has been set with '${this.clientRequestId}'.`);
        }
        this.clientRequestId = clientRequestId;
    }

    handlePortResponse = ({ data }) => {
        const {
            requestId,
            responseId,
            data: returnData = {},
        } = data;
        const id = responseId || requestId;
        const callbacks = this.callbacks[id];
        if (callbacks) {
            delete this.callbacks[id];
            callbacks.forEach(callback => callback(returnData));
        }
        this.portResponses.add(responseId, returnData);
    };

    async postToBackground({
        type,
        clientRequestId,
        data,
    }, callback = null) {
        const requestId = clientRequestId || randomId();
        const responseId = clientRequestId
            ? randomId()
            : requestId;
        this.callbacks[responseId] = callback
            ? [callback]
            : [];

        this.port.postMessage({
            type,
            requestId,
            responseId,
            data,
            clientId: this.portId,
            sender: 'UI_CLIENT',
        });

        return new Promise(resolve => this.registerResponse(
            responseId,
            resolve,
        ));
    }

    registerResponse(responseId, callback) {
        if (this.callbacks[responseId]) {
            this.callbacks[responseId].push(callback);
            return;
        }

        const data = this.portResponses.get(responseId);
        if (data) {
            callback(data);
        } else {
            warnLog(`Cannot find request with id '${responseId}'`);
        }
    }
}

export default ConnectionManager;
