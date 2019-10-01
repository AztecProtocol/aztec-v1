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
    clientEvent,
    actionEvent,
    sendTransactionEvent,
} from '~config/event';
import {
    updateActionState,
    openPopup,
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

        this.GraphSubject = new Subject();
        this.graph$ = this.GraphSubject.asObservable();

        this.ClientResponseSubject = new Subject();
        this.clientResponse$ = this.ClientResponseSubject.asObservable();

        this.ClientActionSubject = new Subject();
        this.clientAction$ = this.ClientActionSubject.asObservable();

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
        // message the UI
        this.message$.pipe(
            filter(({ data }) => data.type === 'ACTION_RESPONSE'),
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
            map((action) => {
                const {
                    timestamp,
                } = action;
                return openPopup({ timestamp });
            }), // we can extend this to automatically close the window after a timeout
        ).subscribe();

        // this.message$.subscribe();
        // we need to setup a stream that relays messages to the client and back to the UI
        this.message$.pipe(
            // we filter the stream here
            filter(({ data }) => data.type === actionEvent),
            mergeMap(data => from(ClientActionService.triggerClientAction(data, this)())
                .pipe(map(result => ({ ...result, responseId: data.data.responseId })))),
            tap(({ uiClientId, ...rest }) => {
                this.connections[uiClientId].postMessage({
                    ...rest,
                });
            }),
        ).subscribe();

        this.message$.pipe(
            filter(({ data }) => data.type === sendTransactionEvent),
            mergeMap(data => from(TransactionSendingService.sendTransaction(data))),
            tap(({
                uiClientId, requestId, responseId, ...rest
            }) => {
                this.connections[uiClientId].postMessage({
                    requestId,
                    responseId,
                    data: {
                        type: 'ACTION_RESPONSE',
                        ...rest,
                    },
                });
            }),
        ).subscribe();

        this.message$.pipe(
            filter(({ data }) => data.type === 'UI_QUERY_REQUEST'),
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
                ...rest
            }) => {
                this.connections[uiClientId].postMessage({
                    requestId,
                    data: {
                        type: 'UI_QUERY_RESPONSE',
                        response: {
                            ...response,
                        },
                    },
                });
            }),
        ).subscribe();

        this.api$ = this.message$.pipe(
            filter(({ data }) => data.type === clientEvent),
            mergeMap(data => from(ApiService.clientApi(data, this))),
            tap((data) => {
                this.ClientResponseSubject.next({
                    ...data,
                    data: {
                        response: data.response,
                        type: 'CLIENT_RESPONSE',
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
        extension,
        data,
        ...rest
    }) => {
        const {
            uiClientId,
            webClientId,
        } = this.requests[requestId] || {};

        this.requests[requestId] = {
            uiClientId: extension ? senderId : uiClientId,
            webClientId: !extension ? senderId : webClientId,
        };

        // TODO clear these out when the request is finished or after a timeout

        return {
            data,
            requestId,
            ...rest,
            ...this.requests[requestId],
        };
    }

    registerClient = (client) => {
        this.connections[client.name] = client;
        this.connections[client.name].requests = {};
        client.onMessage.addListener(({
            requestId,
            ...data
        }, sender) => {
            this.MessageSubject.next({
                data,
                senderId: client.name,
                requestId,
                sender: sender.sender,
            });
        });
    }
}

export default Connection;
