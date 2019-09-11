import {
    from,
    Subject,
    BehaviorSubject,
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
} from '~config/event';
import {
    updateActionState,
    openPopup,
    addDomainData,
} from './connectionUtils';

import ApiService from '../services/ApiService';
import ClientActionService from '../services/ClientActionService';

class Connection {
    constructor() {
        this.UiActionSubject = new Subject();
        this.ui$ = this.UiActionSubject.asObservable();
        this.UiResponseSubject = new BehaviorSubject(false);
        this.uiResponse$ = this.UiResponseSubject.asObservable();

        this.ActionResponseSubject = new Subject();
        this.actionResponse$ = this.ActionResponseSubject.asObservable();

        this.MessageSubject = new Subject();
        this.ApiSubject = new Subject();

        this.ClientResponseSubject = new Subject();
        this.clientResponse$ = this.ClientResponseSubject.asObservable();

        this.ClientActionSubject = new Subject();
        this.clientAction$ = this.ClientActionSubject.asObservable();

        // this stream of events does the following
        // 1. save the action state to the storage so it can be loaded by the UI thread
        // 2. trigger the UI popup

        this.ui$.pipe(
            mergeMap(action => from(updateActionState(action))),
            map(openPopup), // we can extend this to automatically close the window after a timeout
        ).subscribe();


        // send the messages to the client
        merge(this.clientResponse$, this.clientAction$).pipe(
            tap(({ clientId, ...rest }) => {
                console.log(this.connections, clientId, rest);
                this.connections[clientId].postMessage({
                    ...rest,
                    clientId,
                });
            }),
        ).subscribe();

        this.message$ = this.MessageSubject.asObservable().pipe(
            // here we need to filter the events int to types
            map(addDomainData),
            tap((data) => {
                switch (data.type) {
                    case clientEvent: {
                        this.ApiSubject.next(data);
                        break;
                    }
                    case 'ACTION_RESPONSE': {
                        this.ActionResponseSubject.next(data);
                        break;
                    }
                    case 'UI_ACTION': {
                        this.UiActionSubject.next(data);
                        break;
                    }
                    case actionEvent: {
                        this.ClientActionSubject.next(data);
                        break;
                    }
                    default: {
                        break;
                    }
                }
            }),
        );

        this.message$.subscribe();
        // we need to setup a stream that relays messages to the client and back to the UI
        this.MessageSubject.asObservable().pipe(
            // we filter the stream here
            filter(({ type }) => type === actionEvent),
            mergeMap(data => from(ClientActionService.triggerClientAction(data))),
            tap(({ clientId, ...rest }) => {
                this.connections[clientId].postMessage({
                    ...rest,
                    clientId,
                });
            }),

        ).subscribe();

        this.api$ = this.ApiSubject.asObservable().pipe(
            mergeMap(data => from(ApiService.clientApi(data, this))),
            tap((data) => {
                this.ClientResponseSubject.next({
                    ...data,
                    type: 'CLIENT_RESPONSE',
                });
            }),
        );
        this.api$.subscribe();

        this.connections = {};
    }

    registerClient = (client) => {
        this.connections[client.name] = client;
        client.onMessage.addListener((msg, sender) => {
            this.MessageSubject.next({
                data: msg,
                sender: sender.sender,
            });
        });
    }
}

export default Connection;
