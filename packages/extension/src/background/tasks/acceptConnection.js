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

export default function acceptConnection() {
    const ui = new Subject();
    const uiConfirms = new Subject();
    const uiErrors = new Subject();

    const ui$ = ui.asObservable();
    ui$.pipe(
        map(() => {
            window.open('popup.html', 'extension_popup', 'width=300,height=400,status=no,scrollbars=yes,resizable=no');
        }),
    ).subscribe();

    const handleAction = (action) => {
        // we need to mutate the db here to pass the error to the popup
        // await updateActionState(action);
        ui.next(action);
        // we have to return an observable to original$
        const uiConfirms$ = uiConfirms.asObservable()
            .pipe(
                filter(({ requestId }) => requestId === action.data.requestId),
                take(1),
            );

        const uiErrors$ = uiErrors.asObservable().pipe(
            take(1),
        );
        const uiTimeout$ = timer(10000).pipe(
            map(() => dataError('extension.timeout')),
        );
        return from(updateActionState(action)).pipe(
            mergeMap(() => race(
                uiConfirms$,
                uiTimeout$,
                uiErrors$,
            )),
            take(1),
        );
    };

    const handleMessage = (msg, senderDetails) => new Promise((resolve, reject) => {
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
                    const action$ = handleAction({
                        type: errorToActionMap[errorData.key],
                        data: {
                            requestId,
                        },
                    });
                    action$.subscribe((actionResponse) => {
                        if (actionResponse.error) {
                            messageSubject.error(actionResponse);
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

        message$.subscribe(resolve, reject);

        messageSubject.next({ data: msg, sender: senderDetails });
    });


    browser.runtime.onMessage.addListener((msg, sender) => {
        switch (msg.type) {
        case clientEvent: {
            return handleMessage(msg, sender);
        }
        case 'UI_CONFIRM': {
            uiConfirms.next(msg, sender);
            break;
        }
        case 'UI_REJECTION': {
            uiErrors.next(msg, sender);
            break;
        }
        default:
        }
        return null;
    });
}
