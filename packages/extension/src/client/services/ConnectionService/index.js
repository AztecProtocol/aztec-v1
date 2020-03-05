import {
    filter,
    tap,
    take,
} from 'rxjs/operators';
import {
    Subject,
    fromEvent,
} from 'rxjs';
import {
    randomId,
} from '~/utils/random';
import filterStream from '~/utils/filterStream';
import {
    errorLog,
} from '~/utils/log';
import {
    connectionRequestEvent,
    connectionApprovedEvent,
    subscriptionRequestEvent,
    subscriptionResponseEvent,
    subscriptionRemoveEvent,
    clientRequestEvent,
    clientResponseEvent,
    clientDisconnectEvent,
    actionRequestEvent,
    actionResponseEvent,
    uiOpenEvent,
    uiCloseEvent,
} from '~/config/event';
import MetaMaskService from '~/client/services/MetaMaskService';
import ApiError from '~/client/utils/ApiError';
import getSiteData from '~/client/utils/getSiteData';
import getApiKeyQuota from '~/client/utils/getApiKeyQuota';
import getApiKeyApproval from '~/client/utils/getApiKeyApproval';
import backgroundFrame from './backgroundFrame';

class ConnectionService {
    constructor() {
        this.callbackMapping = {};
        this.disconnectRequestId = null;
    }

    async init() {
        this.clientId = randomId();
        this.setInitialVars();
        await backgroundFrame.init();
    }

    setInitialVars() {
        this.apiKey = '';
        this.port = null;
        this.MessageSubject = null;
        this.messages$ = null;
        this.subscriptions = {
            /*
             * [type]: {
             *     [id]: [Subscriber!],
             * }
             *
             * - Subscriber: {
             *       requestId,
             *       callback,
             *   }
             */
            ASSET_BALANCE: {},
        };
    }

    async disconnect() {
        if (!this.port) return;

        let requestId = this.disconnectRequestId;
        let callbackKey = `${requestId}-disconnect`;
        if (requestId) {
            await new Promise((resolve) => {
                if (!this.callbackMapping[callbackKey]) {
                    this.callbackMapping[callbackKey] = [];
                }
                this.callbackMapping[callbackKey].push(resolve);
            });
            return;
        }

        requestId = randomId();
        this.disconnectRequestId = requestId;
        callbackKey = `${requestId}-disconnect`;

        backgroundFrame.close();

        await this.postToBackground({
            type: clientDisconnectEvent,
            requestId,
        });

        this.disconnectRequestId = null;
        this.setInitialVars();

        if (this.callbackMapping[callbackKey]) {
            this.callbackMapping[callbackKey].forEach((cb) => {
                cb();
            });
        }
    }

    async openConnection(clientProfile) {
        if (this.port) {
            errorLog('Connection to background has been established');
        }
        const {
            apiKey,
        } = clientProfile;
        this.apiKey = apiKey;

        const frame = await backgroundFrame.ensureCreated();
        const requestId = randomId();

        const backgroundResponse = fromEvent(window, 'message')
            .pipe(
                filter(({ data }) => data.type === connectionApprovedEvent),
                tap(this.setupStreams),
                take(1),
            ).toPromise();

        frame.contentWindow.postMessage({
            type: connectionRequestEvent,
            requestId,
            clientId: this.clientId,
            sender: 'WEB_CLIENT',
            clientProfile,
        }, '*');

        const {
            data: {
                data: networkConfig,
            },
        } = await backgroundResponse;

        return networkConfig;
    }

    setupStreams = ({ ports }) => {
        this.MessageSubject = new Subject();
        this.messages$ = this.MessageSubject.asObservable();

        [this.port] = ports;
        this.port.onmessage = ({ data }) => {
            const {
                type,
                requestId,
            } = data;
            switch (type) {
                case uiOpenEvent:
                    backgroundFrame.open();
                    break;
                case uiCloseEvent:
                    backgroundFrame.close();
                    break;
                case subscriptionResponseEvent:
                    this.handleReceiveSubscription(data.response);
                    break;
                case actionRequestEvent:
                    this.handleClientActionRequest(data);
                    break;
                case clientResponseEvent:
                    this.handleReceiveResponse(data);
                    break;
                default:
            }
            if (this.callbackMapping[requestId] && this.callbackMapping[requestId][type]) {
                this.callbackMapping[requestId][type].forEach(cb => cb());
            }
        };
    }

    handleReceiveResponse(data) {
        this.MessageSubject.next(data);
    }

    async handleClientActionRequest(data) {
        const {
            requestId,
            responseId,
            data: {
                action,
                params,
            },
        } = data;
        let response;

        switch (action) {
            case 'apiKeyQuota':
                response = await getApiKeyQuota(this.apiKey);
                break;
            case 'apiKeyApproval':
                response = await getApiKeyApproval(this.apiKey, params);
                break;
            default:
                response = await MetaMaskService(action, params);
        }

        this.port.postMessage({
            type: actionResponseEvent,
            origin: window.location.origin,
            clientId: this.clientId,
            sender: 'WEB_CLIENT',
            requestId,
            responseId,
            data: response,
        });
    }

    async postToBackground({
        type,
        data,
        requestId: customRequestId,
    }) {
        if (!this.port) {
            return {
                data: {},
            };
        }

        const requestId = customRequestId || randomId();
        this.port.postMessage({
            type,
            clientId: this.clientId,
            requestId,
            data,
            origin: window.location.origin,
            sender: 'WEB_CLIENT',
        });

        return filterStream(clientResponseEvent, requestId, this.MessageSubject.asObservable());
    }

    async subscribe(requestId, type, id, callback) {
        const subscriptions = this.subscriptions[type];
        if (!subscriptions) {
            errorLog(`Unavailable subscription type '${type}'.`);
            return false;
        }

        if (!subscriptions[id]) {
            const {
                response: {
                    granted,
                } = {},
            } = await this.postToBackground({
                type: subscriptionRequestEvent,
                data: {
                    type,
                    id,
                },
            });

            if (!granted) {
                return false;
            }

            subscriptions[id] = [];
        } else if (subscriptions[id].some(s => s.requestId === requestId
            && s.callback === callback)
        ) {
            return true;
        }

        subscriptions[id].push({
            requestId,
            callback,
        });

        return true;
    }

    async unsubscribe(requestId, type, id, callback) {
        const prevSubscribers = this.subscriptions[type] && this.subscriptions[type][id];
        if (!prevSubscribers) {
            return null;
        }

        const removedSubscriber = prevSubscribers
            .find(s => s.requestId === requestId && s.callback === callback);
        if (!removedSubscriber) {
            return null;
        }

        const restSubscribers = prevSubscribers
            .filter(subscriber => subscriber !== removedSubscriber);

        if (restSubscribers.length) {
            this.subscriptions[type][id] = restSubscribers;
        } else {
            delete this.subscriptions[type][id];
            await this.postToBackground({
                type: subscriptionRemoveEvent,
                data: {
                    type,
                    id,
                },
            });
        }

        return removedSubscriber.callback;
    }

    handleReceiveSubscription({
        type,
        id,
        value,
    }) {
        this.subscriptions[type][id].forEach(({
            callback,
        }) => {
            callback(
                value,
                {
                    type,
                    id,
                },
            );
        });
    }

    async query(queryName, args = {}, queryStr) {
        const {
            data,
        } = await this.postToBackground({
            type: clientRequestEvent,
            data: {
                query: queryName,
                queryStr,
                args,
                site: getSiteData(),
            },
        }) || {};

        if (!data || data.error) {
            throw new ApiError(data);
        }

        const dataKey = Object.keys(data)
            .find(key => !!data[key]);

        if (dataKey === undefined) {
            return null;
        }

        const {
            error,
        } = data[dataKey] || {};
        if (error) {
            throw new ApiError(data[dataKey]);
        }

        return data[dataKey];
    }
}

export default new ConnectionService();
