import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

export default packageName => taskFactory('truffle', 'migrate --reset', locatePackage(packageName), { wait: true });
