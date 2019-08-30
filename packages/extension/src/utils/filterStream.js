import {
    filter,
    timeout,
    tap,
    take,
} from 'rxjs/operators';

const filterStream = (type, requestId, stream$) => stream$.pipe(
    filter(data => data.type === type && data.requestId === requestId),
    take(1),
    // timeout(15000),
).toPromise();

export default filterStream;
