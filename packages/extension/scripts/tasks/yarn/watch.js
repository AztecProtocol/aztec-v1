import taskFactory from '../factory';
import isReadyPredicateFactory from '../../utils/isReady';
import {
    locatePackage,
} from '../../utils/path';

export default packageName => taskFactory('yarn', 'watch', locatePackage(packageName), {
    isReadyPredicate: isReadyPredicateFactory('Built at:'),
});
