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
} from '~config/event';
import {
    errorToActionMap,
} from '~config/action';
import GraphQLService from '../services/GraphQLService';


const updateActionState = async (action) => {
    const actionTimeStamp = Date.now();
    // lookup action
    return actionModel.set({
        timestamp: actionTimeStamp,
        type: action.key,
        data: {
            ...action,
        },
    });
};


class Connection {
    constructor() {
        this.UiSubject = new Subject();
        this.UiConfirmationSubject = new Subject();
        this.UiRejectionSubject = new Subject();
        this.ui$ = this.UiSubject.asObservable();
        this.uiConfirmation$ = this.UiConfirmationSubject.asObservable();
        this.uiRejection$ = this.UiRejectionSubject.asObservable();

        this.ui$.pipe(
            map(() => window.open('popup.html', 'extension_popup', 'width=300,height=400,status=no,scrollbars=yes,resizable=no')),
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
                    timer(3000).pipe(
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
                const {
                    domain,
                } = psl.parse(url.replace(/^https?:\/\//, '').split('/')[0]);

                return {
                    domain,
                    ...data,
                };
            }),
            mergeMap(({
                mutation, query, domain, variables, requestId,
            }) => {
                let type = 'query';
                if (mutation) {
                    type = 'mutation';
                }
                // we always want the domain to be from the sender so the user can't fake this
                const graphQuery = insertVariablesToGql(
                    mutation || query,
                    {
                        domain,
                    },
                );

                return forkJoin({
                    response: from(
                        GraphQLService[type]({
                            [type]: gql(`${type} {${graphQuery}}`),
                            variables,
                            requestId,
                        }),
                    ),
                    request: of(requestId),
                });
            }),
            switchMap(({ response: { requestId, ...rest } }) => {
                const queryName = Object.keys(rest)
                    .find(name => !!rest[name].error);
                const errorData = queryName ? rest[queryName].error : false;
                // check the action mapping

                if (errorToActionMap[errorData.key]) {
                    // trigger the UI flow
                    const action$ = this.handleAction({
                        type: errorToActionMap[errorData.key],
                        data: {
                            requestId,
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
                }

                if (errorData.key && !errorToActionMap[errorData.key]) {
                    messageSubject.error({ requestId, ...errorData });
                }

                if (!errorData) {
                    return of({
                        requestId,
                        data: rest,
                    });
                }
                return empty();
            }),
            filter(result => !!result),
            take(1),
        );
        return new Promise((resolve, reject) => {
            message$.subscribe(resolve, (error) => {
                resolve(error);
            });
            messageSubject.next({ data: msg, sender: senderDetails });
        });
    }
}

export default function acceptConnection() {
    const connection = new Connection();

    browser.runtime.onMessage.addListener((msg, sender) => {
        switch (msg.type) {
        case clientEvent: {
            const response = connection.handleMessage(msg, sender);
            console.log(response);
            return response;
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
}
