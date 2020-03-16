import chalk from 'chalk';

import bash from '../tasks/utils/bash';

import {
    log,
} from '../utils/log';

const showHints = () => {
    log('\n');
    log('\n');
    log('  To see demo, run the following in other terminal windows:\n');
    log(`    ${chalk.cyan('http-server -p 3000')}               - run it in ${chalk.yellow('/demo')}.`);
    log('\n');
    log('  Run these commands if you change the files that are not being watched:\n');
    log(`    ${chalk.cyan('yarn copy')}               - copy icons to their destination.`);
    log(`                              run this if package ${chalk.yellow('eth-contract-metadata')} is changed.`);
    log(`    ${chalk.cyan('yarn deploy:contracts')}   - migrate contracts.`);
    log(`                              run this if any file in ${chalk.yellow('/contracts')} is changed.`);
    log(`    ${chalk.cyan('yarn generate:styles')}    - generate css files and style config.`);
    log(`                              run this if ${chalk.yellow('guacamole.config.js')} is changed.`);
    log('\n');
    log('  To lint all files:');
    log(`    ${chalk.magenta('yarn lint')}`);
    log('\n');
    log('  To run all tests:');
    log(`    ${chalk.magenta('yarn test')}`);
    log('\n');
    log('  To test a specific file:');
    log(`    ${chalk.magenta('jest [FILE_NAME]')}`);
    log('\n');
    log(`  Press ${chalk.yellow('h')} to show the above hints again.`);
    log('\n');
    log('\n');
};

const handleStart = () => {
    log('\n');
    log('\n');
    log(`${chalk.green('✔')} Contracts were deployed, artifacts were copied, birds are chirping, everything is perfect!`);
    log('  Next, you can...');
    showHints();
};

export default async function launchBash() {
    handleStart();
    return bash.launch([], { silent: false });
}
