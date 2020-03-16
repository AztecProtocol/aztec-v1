import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

export default taskFactory('mkcert', '', locatePackage('extension'), { wait: true });
