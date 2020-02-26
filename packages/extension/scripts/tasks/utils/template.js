import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

const scriptsPath = locatePackage('monorepo-scripts');

export default taskFactory(`${scriptsPath}/ci/setServeUrl.sh`, '', locatePackage('extension'), { wait: true });
