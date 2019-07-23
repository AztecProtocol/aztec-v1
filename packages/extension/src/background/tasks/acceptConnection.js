import browser from 'webextension-polyfill';
import gql from 'graphql-tag';
import psl from 'psl';
import actionModel from '~database/models/action';
import { errorLog } from '~utils/log';
import {
    dataError,
} from '~utils/error';
import insertVariablesToGql from '~utils/insertVariablesToGql';
import {
    of,
    from,
    Subject,
    forkJoin,
    race,
    timer,
    empty,
} from 'rxjs';
import {
    mergeMap,
    take,
    map,
    mapTo,
    tap,
    filter,
    timeout,
} from 'rxjs/operators';

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
        mapTo((message) => {
            window.open('popup.html', 'extension_popup', 'width=300,height=400,status=no,scrollbars=yes,resizable=no');
        }),
    ).subscribe();

    const handleAction = async (error, original$, msg) => {
        // we need to mutate the db here to pass the error to the popup
        await updateActionState(error);
        ui.next();
        // we have to return an observable to original$
        const uiConfirms$ = uiConfirms.asObservable()
            .pipe(
                filter(({ requestId }) => requestId === error.requestId),
                take(1),
                mergeMap((d) => {
                    // retry the flow
                    original$.next(msg);
                    return empty();
                }),
            ).subscribe();

        const uiErrors$ = uiErrors.asObservable().pipe(
            take(1),
            mergeMap(() => empty()),
        ).subscribe();
        const uiTimeout$ = timer(15000).pipe(
            map(() => {
                console.log('here');
                return dataError('extension.timeout');
            }),
        );

        return race(
            uiConfirms$,
            uiTimeout$,
            // timeout(150000),
            uiErrors$,
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
                console.log(requestId, domain);
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
            mergeMap(({ response: { requestId, ...rest } }) => {
                const queryName = Object.keys(rest)
                    .find(queryName => !!rest[queryName].error);
                const errorData = queryName ? rest[queryName].error : false;
                // check the action mapping
                console.log(errorData.key, errorToActionMap[errorData.key]);

                if (errorToActionMap[errorData.key]) {
                    // trigger the UI flow
                    return handleAction({
                        type: errorToActionMap[errorData.key],
                        data: {
                            requestId,
                        },
                    }, messageSubject, {
                        data: msg,
                        sender: senderDetails,
                    });
                }
                if (errorData.key && !errorToActionMap[errorData.key]) {
                    messageSubject.error({ requestId, ...errorData });
                    return empty();
                }
                if (!errorData) {
                    return of({ requestId, ...rest });
                }
            }),
            map((d)=> {
                console.log('asdfas',d);
                return d;
            })
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
        default: {
            break;
        }
        }
    });
}
