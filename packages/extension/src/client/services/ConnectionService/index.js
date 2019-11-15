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
    actionRequestEvent,
    actionResponseEvent,
    uiOpenEvent,
    uiCloseEvent,
} from '~config/event';
import Web3Service from '~/client/services/Web3Service';
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

    async openConnection({
        providerUrl,
        contractAddresses,
    }) {
        const {
            networkId,
            account,
        } = Web3Service;

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
            clientProfile: {
                providerUrl,
                contractAddresses,
                networkId,
                currentAddress: account.address,
            },
        }, '*');

        const {
            data: {
                response: {
                    contractsConfigs,
                } = {},
            },
        } = await backgroundResponse;

        return {
            contractsConfigs,
        };
    }

    setupStreams = ({ ports }) => {
        this.MessageSubject = new Subject();
        this.messages$ = this.MessageSubject.asObservable();

        [this.port] = ports;
        this.port.onmessage = ({ data }) => {
            if (data.data.type === uiOpenEvent) {
                backgroundFrame.open();
                return;
            }
            if (data.data.type === uiCloseEvent) {
                backgroundFrame.close();
                return;
            }
            this.MessageSubject.next({
                ...data,
                data: {
                    type: data.type,
                    ...data.data,
                },
            });
        };

        this.messages$.pipe(
            filter(({ data: { type } }) => type === actionRequestEvent),
            mergeMap(data => from(MetaMaskService(data))),
            tap(data => this.port.postMessage({
                type: actionResponseEvent,
                requestId: data.requestId,
                domain: window.location.origin,
                clientId: this.clientId,
                response: data.response,
                sender: 'WEB_CLIENT',
            })),
        ).subscribe();
    }

    postToBackground = async ({
        type,
        query,
        args,
    }) => {
        const requestId = randomId();
        this.port.postMessage({
            type,
            query,
            args: {
                ...args,
                site: getSiteData(),
            },
            clientId: this.clientId,
            requestId,
            domain: window.location.origin,
            sender: 'WEB_CLIENT',
        });

        return filterStream(clientResponseEvent, requestId, this.MessageSubject.asObservable());
    }

    async query(queryName, args = {}) {
        const {
            address,
        } = Web3Service.account || {};

        const {
            data: {
                response,
            },
        } = await this.postToBackground({
            type: clientRequestEvent,
            query: queryName,
            args: {
                ...args,
                currentAddress: address,
                domain: window.location.origin,
            },
        }) || {};

        if (!response || response.error) {
            throw new ApiError(response);
        }

        const responseKey = Object.keys(response)
            .find(key => !!response[key]);
        if (response[responseKey].error) {
            throw new ApiError(response);
        }

        return response[responseKey];
    }
}

export default new ConnectionService();
