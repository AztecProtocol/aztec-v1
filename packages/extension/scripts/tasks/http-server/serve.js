import taskFactory from '../factory';
import isReadyPredicateFactory from '../../utils/isReady';

export default folderToServe => taskFactory('http-server', '', folderToServe, { isReadyPredicate: isReadyPredicateFactory('Hit CTRL-C to stop the server') });
