import launchGanache from '../steps/ganache';
import compileProtocolContracts from '../steps/compile';
import migrateProtocolContracts from '../steps/migrate';
import installCertificate from '../steps/installCertificate';
import createCertificate from '../steps/createCertificate';
import serveSDK from '../steps/serveSDK';
import serveTemplate from '../steps/serveTemplate';
// import launchGSN from '../steps/launchGSN';
import copyContracts from '../steps/copyContracts';
import buildSDK from '../steps/buildSDK';
import runIntegrationTest from '../steps/runIntegrationTest';

import Scenario from './scenario';

export default new Scenario(
    'Integration Tests',
    [
        launchGanache,
        compileProtocolContracts,
        migrateProtocolContracts,
        installCertificate,
        createCertificate,
        installCertificate,
        serveSDK,
        serveTemplate,
        // launchGSN,
        copyContracts,
        buildSDK,
        runIntegrationTest,
    ],
);
