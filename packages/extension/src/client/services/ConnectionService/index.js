import {
    mergeMap,
    filter,
    tap,
    take,
} from 'rxjs/operators';
import {
    Subject,
    fromEvent,
    from,
} from 'rxjs';
import {
    randomId,
} from '~utils/random';
import filterStream from '~utils/filterStream';
import {
    connectionRequestEvent,
    connectionApprovedEvent,
    clientRequestEvent,
    clientResponseEvent,
    clientDisconnectEvent,
    actionRequestEvent,
    actionResponseEvent,
    uiOpenEvent,
    uiCloseEvent,
} from '~config/event';
import MetaMaskService from '~/client/services/MetaMaskService';
import ApiError from '~client/utils/ApiError';
import getSiteData from '~/client/utils/getSiteData';
import backgroundFrame from './backgroundFrame';

class ConnectionService {
    constructor() {
        this.clientId = randomId();
        this.port = null;
        this.MessageSubject = null;
        this.messages$ = null;
    }

    async openConnection(clientProfile) {
        const frame = await backgroundFrame.init();

        const backgroundResponse = fromEvent(window, 'message')
            .pipe(
                filter(({ data }) => data.type === connectionApprovedEvent),
                tap(this.setupStreams),
                take(1),
            ).toPromise();

        frame.contentWindow.postMessage({
            type: connectionRequestEvent,
            requestId: randomId(),
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

    async disconnect() {
        if (!this.port) return;

        await this.postToBackground({
            type: clientDisconnectEvent,
        });
        this.port = null;
    }

    setupStreams = ({ ports }) => {
        this.MessageSubject = new Subject();
        this.messages$ = this.MessageSubject.asObservable();

        [this.port] = ports;
        this.port.onmessage = ({ data }) => {
            const {
                type,
            } = data;
            if (type === uiOpenEvent) {
                backgroundFrame.open();
                return;
            }
            if (type === uiCloseEvent) {
                backgroundFrame.close();
                return;
            }
            this.MessageSubject.next(data);
        };

        this.messages$.pipe(
            filter(({ type }) => type === actionRequestEvent),
            mergeMap(data => from(MetaMaskService(data))),
            tap(({
                requestId,
                responseId,
                response,
            }) => this.port.postMessage({
                type: actionResponseEvent,
                origin: window.location.origin,
                clientId: this.clientId,
                sender: 'WEB_CLIENT',
                requestId,
                responseId,
                data: response,
            })),
        ).subscribe();
    }

    postToBackground = async ({
        type,
        data,
    }) => {
        if (!this.port) {
            return {
                data: {},
            };
        }

        const requestId = randomId();
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

    async query(queryName, args = {}) {
        const {
            data,
        } = await this.postToBackground({
            type: clientRequestEvent,
            data: {
                query: queryName,
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

        if (data[dataKey].error) {
            throw new ApiError(data);
        }

        return data[dataKey];
    }
}

export default new ConnectionService();
