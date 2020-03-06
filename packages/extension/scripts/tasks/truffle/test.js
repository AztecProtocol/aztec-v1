import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

export default taskFactory('truffle', 'test', locatePackage('extension'), { wait: true });
