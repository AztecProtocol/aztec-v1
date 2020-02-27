import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

export default packageName => taskFactory('yarn', 'build:dev', locatePackage(packageName), { wait: true });
