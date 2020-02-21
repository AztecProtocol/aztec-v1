// import detectPort from 'detect-port';
import chalk from 'chalk';

import {
    log,
} from '../utils/log';

import launchGanache from '../steps/ganache';
import compileProtocolContracts from '../steps/compile';
import migrateProtocolContracts from '../steps/migrate';
import installCertificate from '../steps/installCertificate';
import createCertificate from '../steps/createCertificate';
import serveSDK from '../steps/serveSDK';
import serveTemplate from '../steps/serveTemplate';
import launchGSN from '../steps/launchGSN';
import copyContracts from '../steps/copyContracts';
import buildExtension from '../steps/buildExtension';

import Scenario from './scenario';

// const showHints = () => {
//     log('\n');
//     log('\n');
//     log('  To see demo, run the following in other terminal windows:\n');
//     log(`    ${chalk.cyan('yarn watch')}                        - watch file changes in /src.`);
//     log(`    ${chalk.cyan('http-server -p 5555 --cors -s')}     - run it in ${chalk.yellow('/build')}.`);
//     log(`    ${chalk.cyan('http-server -p 3000')}               - run it in ${chalk.yellow('/demo')}.`);
//     log('\n');
//     log('  Run these commands if you change the files that are not being watched:\n');
//     log(`    ${chalk.cyan('yarn copy')}               - copy icons to their destination.`);
//     log(`                              run this if package ${chalk.yellow('eth-contract-metadata')} is changed.`);
//     log(`    ${chalk.cyan('yarn deploy:contracts')}   - migrate contracts.`);
//     log(`                              run this if any file in ${chalk.yellow('/contracts')} is changed.`);
//     log(`    ${chalk.cyan('yarn generate:styles')}    - generate css files and style config.`);
//     log(`                              run this if ${chalk.yellow('guacamole.config.js')} is changed.`);
//     log('\n');
//     log('  To lint all files:');
//     log(`    ${chalk.magenta('yarn lint')}`);
//     log('\n');
//     log('  To run all tests:');
//     log(`    ${chalk.magenta('yarn test')}`);
//     log('\n');
//     log('  To test a specific file:');
//     log(`    ${chalk.magenta('jest [FILE_NAME]')}`);
//     log('\n');
//     log(`  Press ${chalk.yellow('h')} to show the above hints again.`);
//     log('\n');
//     log('\n');
// };

// const handleStart = () => {
//     log('\n');
//     log('\n');
//     log(`${chalk.green('✔')} Contracts were deployed, artifacts were copied, birds are chirping, everything is perfect!`);
//     log('  Next, you can...');
//     showHints();
// };


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
        buildExtension,
    ],
);
