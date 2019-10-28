import {
    filter,
    take,
    tap,
} from 'rxjs/operators';

const filterStream = (type, requestId, stream$) => stream$.pipe(
    filter(({ data, requestId: reqId }) => data.type === type && reqId === requestId),
    take(1),
    // timeout(15000),
).toPromise();

export default filterStream;
