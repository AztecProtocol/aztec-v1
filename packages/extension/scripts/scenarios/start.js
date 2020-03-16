import launchGanache from '../steps/ganache';
import compileProtocolContracts from '../steps/compile';
import migrateProtocolContracts from '../steps/migrate';
import installCertificate from '../steps/installCertificate';
import createCertificate from '../steps/createCertificate';
import serveSDK from '../steps/serveSDK';
import serveTemplate from '../steps/serveTemplate';
import launchGSN from '../steps/launchGSN';
import copyContracts from '../steps/copyContracts';
import watchSDK from '../steps/watchSDK';
import launchBash from '../steps/launchBash';

import Scenario from './scenario';

export default new Scenario(
    'Start Ganache',
    [
        launchGanache,
        compileProtocolContracts,
        migrateProtocolContracts,
        installCertificate,
        createCertificate,
        installCertificate,
        serveSDK,
        serveTemplate,
        launchGSN,
        copyContracts,
        watchSDK,
        launchBash,
    ],
);
