import browser from 'webextension-polyfill';
import gql from 'graphql-tag';
import psl from 'psl';
import {
    of,
    from,
    Subject,
    forkJoin,
    timer,
    race,
    empty,
} from 'rxjs';
import {
    mergeMap,
    switchMap,
    take,
    map,
    filter,
} from 'rxjs/operators';
import actionModel from '~database/models/action';
import {
    dataError,
} from '~utils/error';
import insertVariablesToGql from '~utils/insertVariablesToGql';
import {
    clientEvent,
    contentSubscribeEvent,
    contentUnsubscribeEvent,
} from '~config/event';
import {
    errorToActionMap,
} from '~config/action';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';
import GraphQLService from '../services/GraphQLService';

const updateActionState = async action => actionModel.set(action);

class Connection {
    constructor() {
        this.UiSubject = new Subject();
        this.UiConfirmationSubject = new Subject();
        this.UiRejectionSubject = new Subject();
        this.ui$ = this.UiSubject.asObservable();
        this.uiConfirmation$ = this.UiConfirmationSubject.asObservable();
        this.uiRejection$ = this.UiRejectionSubject.asObservable();

        this.ui$.pipe(
            map(({ timestamp }) => {
                const popupURL = browser.extension.getURL('pages/popup.html');
                const { width, height } = window.screen;

                browser.windows.create({
                    url: `${popupURL}?id=${timestamp}`,
                    width: 340, // approximate golden ratio
                    top: (height - 550) / 2,
                    left: (width - 340) / 2,
                    height: 550,
                    type: 'popup',
                    focused: true,
                });
                // window.open('popup.html', 'AZTEC Extension', 'width=300,height=400,resizable=no,alwaysRaised=yes,alwaysOnTop=yes,z-lock=yes,centerscreen=yes')
            }),
            // we can extend this to automatically close the window after a timeout
        ).subscribe();
    }

    handleAction(action) {
        return from(updateActionState(action)).pipe(
            mergeMap(() => {
                this.UiSubject.next(action);
                return race(
                    this.uiConfirmation$.pipe(
                        filter(({ requestId }) => requestId === action.data.requestId),
                        take(1),
                    ),
                    this.uiRejection$.pipe(
                        filter(({ requestId }) => requestId === action.data.requestId),
                        take(1),
                    ),
                    timer(15000).pipe(
                        map(() => dataError('extension.timeout')),
                    ),
                );
            }),
            take(1),
        );
    }

    handleMessage(msg, senderDetails) {
        const messageSubject = new Subject();

        const message$ = messageSubject.asObservable().pipe(
            map(({ data, sender }) => {
                const {
                    url,
                } = sender;
                let domain;
                if (url.match(/^https?:\/\/(127.0.0.1|localhost)(:[0-9+]|\/)/)) {
                    domain = 'localhost';
                } else {
                    ({
                        domain,
                    } = psl.parse(url.replace(/^https?:\/\//, '').split('/')[0]));
                }

                return {
                    domain,
                    ...data,
                };
            }),
            mergeMap(({
                mutation,
                query,
                domain,
                variables,
                requestId,
            }) => {
                // we always want the domain to be from the sender so the user can't fake this
                const graphQuery = insertVariablesToGql(
                    mutation || query,
                    {
                        domain,
                    },
                );

                const type = mutation ? 'mutation' : 'query';

                return forkJoin({
                    response: from(
                        GraphQLService[type]({
                            [type]: gql(`${type} {${graphQuery}}`),
                            variables,
                        }),
                    ),
                    requestId: of(requestId),
                });
            }),
            switchMap(({ response, requestId }) => {
                const queryName = Object.keys(response)
                    .find(name => !!response[name].error);
                const errorData = queryName ? response[queryName].error : false;
                // check the action mapping
                if (errorData && errorToActionMap[errorData.key]) {
                    // trigger the UI flow
                    const action$ = this.handleAction({
                        type: errorToActionMap[errorData.key],
                        timestamp: Date.now(),
                        data: {
                            requestId,
                            response: JSON.parse(errorData.response),
                        },
                    });
                    action$.subscribe((actionResponse) => {
                        if (actionResponse.error) {
                            messageSubject.error({
                                requestId,
                                ...actionResponse,
                            });
                        } else {
                            messageSubject.next({
                                data: msg,
                                sender: senderDetails,
                            });
                        }
                    });
                    return empty();
                }
                return of({
                    requestId,
                    data: response,
                });
            }),
            filter(result => !!result),
            take(1),
        );
        return new Promise((resolve) => {
            message$.subscribe(resolve, resolve);
            messageSubject.next({ data: msg, sender: senderDetails });
        });
    }
}

const handleContentScriptSubscription = (data, port) => {
    const {
        type,
    } = data;

    switch (type) {
        case contentSubscribeEvent:
            ClientSubscriptionService.subscribe(port);
            break;
        case contentUnsubscribeEvent:
            ClientSubscriptionService.unsubscribe(port);
            port.onMessage.removeListener(handleContentScriptSubscription);
            port.disconnect();
            break;
        default:
    }
};

export default function acceptConnection() {
    const connection = new Connection();

    browser.runtime.onMessage.addListener((msg, sender) => {
        switch (msg.type) {
            case clientEvent: {
                return connection.handleMessage(msg, sender);
            }
            case 'UI_CONFIRM': {
                connection.UiConfirmationSubject.next(msg, sender);
                break;
            }
            case 'UI_REJECTION': {
                connection.UiRejectionSubject.next(msg, sender);
                break;
            }
            default:
        }
        return null;
    });

    browser.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener(handleContentScriptSubscription);
        port.onDisconnect.addListener(p => ClientSubscriptionService.unsubscribe(p));
    });
}
