import path from 'path';

import taskFactory from '../factory';
import isReadyPredicateFactory from '../../utils/isReady';
import {
    locatePackage,
} from '../../utils/path';


export default taskFactory('npx', 'oz-gsn run-relayer --detach --quiet', path.resolve(locatePackage('extension'), './build/gsn'), { isReadyPredicate: isReadyPredicateFactory('Relay is funded and ready!') });
