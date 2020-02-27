import taskFactory from '../factory';
import isReadyPredicateFactory from '../../utils/isReady';
import {
    locatePackage,
} from '../../utils/path';

export default taskFactory('ganache-cli', '', locatePackage('extension'), {
    isReadyPredicate: isReadyPredicateFactory('Listening on'),
});
