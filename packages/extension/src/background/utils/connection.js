import {
    of,
    from,
    Subject,
    BehaviorSubject,
    ReplaySubject,
    combineLatest,
    empty,
} from 'rxjs';
import {
    mergeMap,
    switchMap,
    take,
    tap,
    map,
    filter,
    startWith,
    retryWhen,
    timeout,
    first,
} from 'rxjs/operators';
import {
    errorToActionMap,
} from '~config/action';
import {
    dataError,
} from '~utils/error';
import {
    updateActionState,
    openPopup,
    addDomainData,
    handleQuery,
    generateResponseCode,
    generateResponseError,
} from './connectionUtils';

export default class Connection {
    constructor() {
        this.UiEventSubject = new BehaviorSubject(false);
        this.uiEvent$ = this.UiEventSubject.asObservable();

        this.actionSubject = new Subject();
        this.action$ = this.actionSubject.asObservable();

        // this stream of events does the following
        // 1. save the action state to the storage so it can be loaded by the UI thread
        // 2. trigger the UI popup
        //
        this.action$.pipe(
            mergeMap(action => from(updateActionState(action))),
            map(openPopup), // we can extend this to automatically close the window after a timeout
        ).subscribe();
    }

    // think of RXJS pipe statements as recipes that apply to streams of events
    // this stream does the following
    // 1. augments the input event with any domain data parsed from the browser event
    // 2. queries the local GraphQLService for the requested resource
    // 3. handles error


    handleMessage = query => of(query).pipe(
        // these messages are requesting proofs or notes or balances
        map(addDomainData),
        mergeMap(query => combineLatest(
            from(handleQuery(query)),
            this.filterUiEventsForRejections(query),
        )),
        map(([data, uiError, timeoutError]) => {
            data.code = generateResponseCode(data, uiError, timeoutError);
            return [data, uiError, timeoutError];
        }),
        // we want to executure the following flow
        // get the latest from either a timeout / the query / or an error
        switchMap(([data, uiError, timeoutError]) => {
            // we need to figure out the priority here
            // 1.if there is a timeout we always end
            // 2. if there is a uiError we always end
            // 3. if there is a response we look at the response code to decide what to do
            const { requestId, response, code } = data;

            switch (code) {
                case 200: {
                    return of({ response, requestId });
                }
                case 401: // auth issues
                {
                    this.actionSubject.next(generateResponseError(data, uiError, timeoutError));
                    throw errorData;
                    return empty();
                }
                case 408: // timeout issues
                {
                    return of({
                        requestId,
                        ...dataError('extension.timeout'),
                    });
                }
                case 403: // denied error
                {
                    return of({
                        requestId,
                        ...uiError,
                    });
                }
                default: {
                    return empty();
                }
            }
        }),
        retryWhen(errors => errors.pipe(
            // we retry when we receivce confirmation or rejection that something has changed from one of the other observables
            mergeMap(this.filterUiEvents),
        )),
        take(1),
    ).toPromise()


    filterUiEventsForRejections = query => this.uiEvent$.pipe(
        filter(action => action && query.requestId === action.data.requestId && action.type === 'UI_REJECTION'),
        startWith(false),
    );

    filterUiEvents = query => this.uiEvent$.pipe(
        filter(action => action && query.requestId === action.data.requestId),
    );
}
