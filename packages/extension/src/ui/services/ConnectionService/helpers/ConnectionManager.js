import browser from 'webextension-polyfill';
import {
    actionEvent,
} from '~config/event';
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

    openConnection() {
        if (this.port) {
            warnLog('Connection has been established.');
            return;
        }
        this.portId = randomId();
        this.port = browser.runtime.connect({ name: this.portId });
        this.port.onMessage.addListener(this.handlePortResponse);
    }

    setDefaultClientRequestId(clientRequestId) {
        if (this.clientRequestId) {
            warnLog(`clientRequestId has been set with '${this.clientRequestId}'.`);
        }
        this.clientRequestId = clientRequestId;
    }

    handlePortResponse = (response) => {
        const {
            responseId,
            data: {
                response: returnData,
            } = {},
        } = response;
        const callbacks = this.callbacks[responseId];
        if (callbacks) {
            delete this.callbacks[responseId];
            callbacks.forEach(callback => callback(returnData));
        }
        this.portResponses.add(responseId, returnData);
    };

    async postToBackground({
        type,
        clientRequestId,
        data,
    }, callback = null) {
        const requestId = type === actionEvent
            ? clientRequestId || this.clientRequestId
            : randomId();
        const responseId = type === actionEvent
            ? randomId()
            : requestId;
        this.callbacks[responseId] = callback
            ? [callback]
            : [];

        console.log('postToBackground', {
            type,
            requestId,
            responseId,
            clientRequestId,
            data,
        });
        this.port.postMessage({
            type,
            requestId,
            responseId,
            data,
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
