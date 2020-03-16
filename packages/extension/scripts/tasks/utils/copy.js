import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

export default taskFactory('cp', '-r', locatePackage('extension'), { wait: true });
