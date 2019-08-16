import browser from 'webextension-polyfill';
import {
    clientEvent,
    contentSubscribeEvent,
    contentUnsubscribeEvent,
} from '~config/event';
import Connection from '../utils/connection.js';
import ClientSubscriptionService from '~background/services/ClientSubscriptionService';

<<<<<<< HEAD
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
                    response,
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
=======
>>>>>>> feat(extension): refactor rxjs so we can await metamask

const handleContentScriptSubscription = (data, port) => {
    const {
        type,
    } = data;

    switch (type) {
        case contentSubscribeEvent:
            ClientSubscriptionService.subscribe(port);
            port.onDisconnect.addListener(p => ClientSubscriptionService.unsubscribe(p));
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

    browser.runtime.onMessage.addListener(async (msg, sender) => {
        switch (msg.type) {
            case clientEvent: {
                return await connection.handleMessage({ data: msg, sender });
            }
            case 'UI_CONFIRM': {
                connection.UiEventSubject.next(msg, sender);
                break;
            }
            case 'UI_REJECTION': {
                connection.UiEventSubject.next(msg, sender);
                break;
            }
            default:
        }
        return null;
    });

    browser.runtime.onConnect.addListener((port) => {
        port.onMessage.addListener(handleContentScriptSubscription);
    });
}
