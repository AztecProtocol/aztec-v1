import browser from 'webextension-polyfill';
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

    postToBackground({
        type,
        requestId,
        data,
    }, callback = null) {
        const responseId = randomId();
        this.callbacks[responseId] = callback
            ? [callback]
            : [];

        console.log('postToBackground', {
            type,
            requestId,
            responseId,
            data,
        });
        this.port.postMessage({
            type,
            requestId,
            responseId,
            data,
        });

        return {
            onReceiveResponse: otherCallback => this.registerResponse(
                responseId,
                otherCallback,
            ),
        };
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
