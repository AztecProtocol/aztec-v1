import browser from 'webextension-polyfill';
import gql from 'graphql-tag';
import psl from 'psl';
import errorModel from '~database/models/error';
import { errorLog } from '~utils/log';
import insertVariablesToGql from '~utils/insertVariablesToGql';
import {
    of,
    from,
    Subject,
    forkJoin,
    race,
    empty,
} from 'rxjs';
import {
    mergeMap,
    take,
    map,
    filter,
    timeout,
} from 'rxjs/operators';

import {
    clientEvent,
} from '~config/event';

import GraphQLService from '../services/GraphQLService';


const updateErrorState = async (error) => {
    const errorTimeStamp = Date.now();
    return errorModel.set({
        timestamp: errorTimeStamp,
        error,
    });
};

export default function acceptConnection() {
    const ui = new Subject();
    const uiConfirms = new Subject();
    const uiErrors = new Subject();

    const ui$ = ui.asObservable();
    ui$.pipe(
        mergeMap((message) => {
            // set some local state so the react app can show correct page
            window.open('popup.html', 'extension_popup', 'width=300,height=400,status=no,scrollbars=yes,resizable=no');
            return of(message);
        }),
    ).subscribe();

    const handleError = async (error, original$, msg) => {
        // we need to mutate the db here to pass the error to the popup
        await updateErrorState(error);
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
            filter(({ requestId }) => requestId !== error.requestId),
            take(1),
            mergeMap(() => empty()),
        ).subscribe();

        return race(
            uiConfirms$,
            timeout(150000),
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

                if (errorData) {
                    // trigger the UI flow
                    ui.next({
                        errorData,
                        requestId,
                    });
                    return handleError({
                        errorData,
                        requestId,
                    }, messageSubject, {
                        data: msg,
                        sender: senderDetails,
                    });
                }
                return of({ requestId, ...rest });
            }),
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
