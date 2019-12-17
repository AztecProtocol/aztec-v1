import {
    connectionRequestEvent,
    uiReadyEvent,
} from '~/config/event';
import {
    warnLog,
} from '~/utils/log';
import {
    randomId,
} from '~/utils/random';
import LRU from '~/utils/caches/LRU';
import Web3Service from '~/helpers/Web3Service';
import listenToInitialAction from '../utils/listenToInitialAction';
import listenToConnectionApproval from '../utils/listenToConnectionApproval';

class ConnectionManager {
    constructor({
        maxActiveResponses = 50,
    } = {}) {
        this.port = null;
        this.clientId = '';
        this.callbacks = {};
        this.portResponses = new LRU(maxActiveResponses);
        this.clientRequestId = '';
    }

    async openConnection() {
        if (this.port) {
            warnLog('Connection has been established.');
            return null;
        }

        this.clientId = randomId();

        const actionPromise = listenToInitialAction();
        const portPromise = listenToConnectionApproval();

        window.parent.postMessage({
            type: uiReadyEvent,
        }, '*');

        window.parent.postMessage({
            type: connectionRequestEvent,
            requestId: randomId(),
            clientId: this.clientId,
            sender: 'UI_CLIENT',
        });

        const [
            action,
            {
                port,
                networkConfig,
            },
        ] = await Promise.all([
            actionPromise,
            portPromise,
        ]);

        const {
            requestId,
            type,
            data,
        } = action;

        this.clientRequestId = requestId;
        this.port = port;
        this.port.onmessage = this.handlePortResponse;

        await Web3Service.init(networkConfig);

        return {
            type,
            data,
        };
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
            clientId: this.clientId,
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
