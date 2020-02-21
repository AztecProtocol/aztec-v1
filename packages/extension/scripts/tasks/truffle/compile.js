import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

export default packageName => taskFactory('truffle', 'compile --all', locatePackage(packageName), { wait: true });
