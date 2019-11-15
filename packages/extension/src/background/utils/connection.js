import {
    from,
    Subject,
    merge,
} from 'rxjs';
import {
    mergeMap,
    tap,
    map,
    filter,
} from 'rxjs/operators';
import {
    clientRequestEvent,
    clientResponseEvent,
    actionRequestEvent,
    sendTransactionEvent,
    uiReadyEvent,
    uiOpenEvent,
    uiCloseEvent,
    sendQueryEvent,
} from '~config/event';
import urls from '~config/urls';
import Iframe from '~/utils/Iframe';
import {
    permissionError,
} from '~/utils/error';
import {
    updateActionState,
    addDomainData,
} from './connectionUtils';
import graphQueryMap from '../../ui/queries';
import ApiService from '../services/ApiService';
import ClientActionService from '../services/ClientActionService';
import TransactionSendingService from '../services/TransactionSendingService';
import GraphQLService from '../services/GraphQLService';

class Connection {
    constructor() {
        this.MessageSubject = new Subject();

        this.UiActionSubject = new Subject();
        this.ui$ = this.UiActionSubject.asObservable();

        this.UiResponseSubject = new Subject();
        this.uiResponse$ = this.UiResponseSubject.asObservable();


        this.GraphSubject = new Subject();
        this.graph$ = this.GraphSubject.asObservable();

        this.ClientResponseSubject = new Subject();
        this.clientResponse$ = this.ClientResponseSubject.asObservable();

        this.ClientActionSubject = new Subject();
        this.clientAction$ = this.ClientActionSubject.asObservable();
        this.containerId = 'aztec-popup-ui';
        this.uiFrame = new Iframe({
            id: 'AZTECSDK-POPUP',
            src: urls.ui,
            width: '100%',
            height: '100%',
            onReadyEventName: uiReadyEvent,
            containerId: this.containerId,
        });

        // send the messages to the client
        merge(this.clientAction$, this.clientResponse$).pipe(
            tap(({ webClientId, ...rest }) => {
                this.connections[webClientId].postMessage({
                    ...rest,
                });
            }),
        ).subscribe();

        this.message$ = this.MessageSubject.asObservable().pipe(
            // here we need to filter the events int to types
            map(addDomainData),
            map(this.withConnectionIds),
        );
        // respond to  the UI
        this.uiResponse$.pipe(
            tap(({ uiClientId, ...rest }) => {
                this.connections[uiClientId].postMessage({
                    ...rest,
                });
            }),
        ).subscribe();

        // this stream of events does the following
        // 1. save the action state to the storage so it can be loaded by the UI thread
        // 2. trigger the UI popup

        this.ui$.pipe(
            mergeMap(action => from(updateActionState(action))),
            map(async (action) => {
                const {
                    requestId,
                } = action;

                const loadingElem = document.getElementById('aztec-popup-placeholder');
                loadingElem.style.display = 'block';

                const uiContainer = document.getElementById(this.containerId);
                uiContainer.style.display = 'none';
                uiContainer.innerHTML = ''; // clear previous ui

                const {
                    webClientId,
                } = this.requests[requestId];
                this.ClientResponseSubject.next({
                    requestId,
                    webClientId,
                    data: {
                        type: uiOpenEvent,
                    },
                });

                await this.uiFrame.init();
                loadingElem.style.display = 'none';
                uiContainer.style.display = 'block';
                this.uiFrame.open();
                this.openUi();
            }), // we can extend this to automatically close the window after a timeout
        ).subscribe();

        // this.message$.subscribe();
        // we need to setup a stream that relays messages to the client and back to the UI
        this.message$.pipe(
            // we filter the stream here
            filter(({ data }) => data.type === actionRequestEvent),
            mergeMap(data => from(ClientActionService.triggerClientAction(data, this)())
                .pipe(map(result => ({ ...result, responseId: data.data.responseId })))),
            tap((data) => {
                this.UiResponseSubject.next(data);
            }),
        ).subscribe();

        this.message$.pipe(
            filter(({ data }) => data.type === sendTransactionEvent),
            mergeMap(data => from(TransactionSendingService.sendTransaction(data))),
            tap((data) => {
                this.UiResponseSubject.next(data);
            }),
        ).subscribe();

        this.message$.pipe(
            filter(({ data }) => data.type === uiCloseEvent),
            tap((data) => {
                const {
                    requestId,
                    webClientId,
                } = data;
                const response = data.data.data;
                this.closeUi();
                this.ClientResponseSubject.next({
                    requestId,
                    webClientId,
                    data: {
                        type: uiCloseEvent,
                        response,
                    },
                });

                const {
                    abort,
                    error,
                } = response;
                if (abort) {
                    this.ClientResponseSubject.next({
                        requestId,
                        webClientId,
                        data: {
                            type: clientResponseEvent,
                            response: error
                                ? { error }
                                : permissionError('user.denied'),
                        },
                    });
                }
            }),
        ).subscribe();

        this.message$.pipe(
            filter(({ data }) => data.type === sendQueryEvent),
            mergeMap((data) => {
                const {
                    data: {
                        data: {
                            query,
                            args,
                        },
                    },
                } = data;
                return from((async () => {
                    const { data: response } = await GraphQLService.query({
                        variables: args,
                        query: graphQueryMap[query],
                    });
                    return {
                        ...data,
                        response,
                    };
                })());
            }),
            tap(({
                uiClientId,
                requestId,
                response,
            }) => {
                this.connections[uiClientId].postMessage({
                    requestId,
                    data: {
                        response,
                    },
                });
            }),
        ).subscribe();

        this.api$ = this.message$.pipe(
            filter(({ data }) => data.type === clientRequestEvent),
            mergeMap(data => from(ApiService.clientApi(data, this))),
            tap((data) => {
                this.ClientResponseSubject.next({
                    ...data,
                    data: {
                        response: data.response,
                        type: clientResponseEvent,
                    },
                });
            }),
        );

        this.api$.subscribe();

        this.connections = {};
        this.requests = {};
    }

    withConnectionIds = ({
        requestId,
        senderId,
        data,
        sender,
        ...rest
    }) => {
        if (!this.requests[requestId]) {
            this.requests[requestId] = {};
        }

        if (sender === 'UI_CLIENT') {
            this.requests[requestId].uiClientId = senderId;
        } else if (sender === 'WEB_CLIENT') {
            this.requests[requestId].webClientId = senderId;
        }

        return {
            data,
            requestId,
            origin,
            sender,
            ...rest,
            ...this.requests[requestId],
        };
    }

    registerClient = ({
        port,
        data,
    }) => {
        this.connections[data.clientId] = port;
        this.connections[data.clientId].onmessage = this.onMessage;
    }

    onMessage = ({
        origin,
        data,
    }) => {
        this.MessageSubject.next({
            data,
            senderId: data.clientId,
            requestId: data.requestId,
            origin: data.domain || origin,
            sender: data.sender,
        });
    }

    closeUi = () => {
        const event = new CustomEvent('closeAztec');
        window.dispatchEvent(event);
    }

    openUi = () => {
        const event = new CustomEvent('openAztec');
        window.dispatchEvent(event);
    }

    removeClient = (client) => {
        delete this.connections[client.name];
        Object.keys(this.requests).forEach((reqId) => {
            const {
                [reqId]: {
                    uiClientId,
                    webClientId,
                } = {},
            } = this.requests;
            if (uiClientId === client.name || webClientId === client.name) {
                delete this.requests[reqId];
            }
        });
    }
}

export default Connection;
