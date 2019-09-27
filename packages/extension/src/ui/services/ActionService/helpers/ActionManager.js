import browser from 'webextension-polyfill';
import {
    warnLog,
} from '~utils/log';
import {
    randomId,
} from '~utils/random';
import LRU from '~utils/caches/LRU';

class ActionManager {
    constructor({
        portName = 'aztec-ui-action',
        queryName = 'aztec-extension-client-query',
        maxActiveResponses = 50,
    } = {}) {
        this.port = null;
        this.portName = portName;
        this.queryName = queryName;
        this.callbacks = {};
        this.portResponses = new LRU(maxActiveResponses);
    }

    openConnection() {
        if (this.port) {
            warnLog('Connection has been established.');
            return;
        }
        this.port = browser.runtime.connect({ name: this.portName });
        this.port.onMessage.addListener(this.handlePortResponse);
    }

    handlePortResponse = (response) => {
        const {
            requestId,
            ...data
        } = response;
        const callbacks = this.callbacks[requestId];
        if (callbacks) {
            delete this.callbacks[requestId];
            callbacks.forEach(callback => callback(data));
        }
        this.portResponses.add(requestId, data);
    };

    postToBackground({
        query,
        args,
    }, callback = null) {
        const requestId = randomId();
        this.callbacks[requestId] = callback
            ? [callback]
            : [];

        this.port.postMessage({
            type: this.queryName,
            requestId,
            query,
            args,
        });

        return requestId;
    }

    registerResponse(requestId, callback) {
        if (this.callbacks[requestId]) {
            this.callbacks[requestId].push(callback);
            return;
        }

        const data = this.portResponses.get(requestId);
        if (data) {
            callback(data);
        } else {
            warnLog(`Cannot find request with id '${requestId}'`);
        }
    }
}

export default ActionManager;
