import launchGanache from '../steps/ganache';
import compileProtocolContracts from '../steps/compile';
import migrateProtocolContracts from '../steps/migrate';
import installCertificate from '../steps/installCertificate';
import createCertificate from '../steps/createCertificate';
import serveTemplate from '../steps/serveTemplate';
import copyContracts from '../steps/copyContracts';
import runIntegrationTest from '../steps/runIntegrationTest';
import setSdkServeUrl from '../steps/setSdkServeUrl';
import deploy from '../steps/deployStagingSDK';

import Scenario from './scenario';

export default new Scenario(
    'Staging Tests',
    [
        launchGanache,
        compileProtocolContracts,
        migrateProtocolContracts,
        copyContracts,
        deploy,
        installCertificate,
        createCertificate,
        installCertificate,
        setSdkServeUrl,
        serveTemplate,
        runIntegrationTest,
    ],
);
