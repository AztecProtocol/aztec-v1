import taskFactory from '../factory';
import {
    locatePackage,
} from '../../utils/path';

const scriptsPath = locatePackage('monorepo-scripts');

export default taskFactory(`${scriptsPath}/aws/aws-bundle-deploy-staging.sh`, '', locatePackage('extension'), { wait: true });
