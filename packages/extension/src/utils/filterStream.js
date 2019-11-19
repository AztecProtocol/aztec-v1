import {
    filter,
    take,
} from 'rxjs/operators';

const filterStream = (expectedType, requestId, stream$) => stream$.pipe(
    filter(({ type, requestId: reqId }) => type === expectedType && reqId === requestId),
    take(1),
    // timeout(15000),
).toPromise();

export default filterStream;
