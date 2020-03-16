import migrateProtocolContracts from '../steps/migrate';

import Scenario from './scenario';

export default new Scenario(
    'Migrate contracts',
    [migrateProtocolContracts],
);
