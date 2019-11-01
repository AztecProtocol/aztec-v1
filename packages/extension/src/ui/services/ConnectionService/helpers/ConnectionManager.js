import {
    uiReadyEvent,
} from '~/config/event';
import {
    warnLog,
} from '~utils/log';
import {
    randomId,
} from '~utils/random';
import LRU from '~utils/caches/LRU';

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
            window.addEventListener('message', (e) => {
                if (e.data.type === 'aztec-connection') {
                    [this.port] = e.ports;
                    this.port.onmessage = this.handlePortResponse;
                    resolve();
                    window.removeEventListener('message');
                }
            });
        });

        window.parent.postMessage({
            type: 'aztec-connection',
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
            data: {
                response: returnData,
            } = {},
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

        console.log(this.port);
        this.port.postMessage({
            type,
            requestId,
            responseId,
            clientId: this.portId,
            data,
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
