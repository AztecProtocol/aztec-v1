import {
    from,
    Subject,
    BehaviorSubject,
    merge,
} from 'rxjs';
import {
    mergeMap,
    tap,
    filter,
    map,
} from 'rxjs/operators';
import {
    errorToActionMap,
} from '~config/action';
import {
    clientEvent,
    contentSubscribeEvent,
    contentUnsubscribeEvent,
} from '~config/event';
import {
    dataError,
} from '~utils/error';
import {
    updateActionState,
    openPopup,
    addDomainData,
    generateResponseError,
} from './connectionUtils';

import ApiService from '../services/ApiService';


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
            tap(console.log),
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
                    default: {
                        break;
                    }
                }
            }),
        );
        this.message$.subscribe();


        this.api$ = this.ApiSubject.asObservable().pipe(
            tap(console.log),
            mergeMap(data => from(ApiService.run(data, this))),
            tap((data) => {
                console.log(data);
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
