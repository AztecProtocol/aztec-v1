import deploy from '../steps/deployStagingSDK';

import Scenario from './scenario';

export default new Scenario(
    'Deploy SDK to staging',
    [deploy],
);
