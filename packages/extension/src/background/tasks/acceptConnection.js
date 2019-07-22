import browser from 'webextension-polyfill';
import gql from 'graphql-tag';
import psl from 'psl';
import errorModel from '~database/models/error';
import { errorLog } from '~utils/log';
import {
    of,
    from,
    Subject,
    race,
    empty,
} from 'rxjs';
import insertVariablesToGql from '~utils/insertVariablesToGql';
import {
    mergeMap,
    take,
    map,
    switchMap,
    catchError,
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
            const w = window.open('popup.html', 'extension_popup', 'width=300,height=400,status=no,scrollbars=yes,resizable=no');
            w.aztecError = message;
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
                mergeMap(() => {
                    // retry the flow
                    original$.next(msg);
                    return empty();
                }),
            );
        const uiErrors$ = uiErrors.asObservable().pipe(
            filter(({ requestId }) => requestId === error.requestId),
            mergeMap(() => empty()),
        );

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

                return from(
                    GraphQLService[type]({
                        [type]: gql(`${type} {${graphQuery}}`),
                        variables,
                        requestId,
                    }),
                );
            }),
            switchMap((response) => {
                if (response.error) {
                    // trigger the UI flow
                    ui.next(response);
                    return handleError(response, messageSubject, {
                        data: msg,
                        sender: senderDetails,
                    });
                }
                return of(response);
            }),
            filter(value => !!value),
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
