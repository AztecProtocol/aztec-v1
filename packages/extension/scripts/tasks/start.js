import detectPort from 'detect-port';
import chalk from 'chalk';
import {
    warnLog,
    errorLog,
    log,
} from '../utils/log';
import {
    argv,
} from '../utils/cmd';
import {
    getPort,
} from '../instances/ganacheInstance';
import setup from './setup';

export default function start({
    onError,
    onClose,
} = {}) {
    const ganachePort = getPort();

    const handleError = (error) => {
        if (error) {
            errorLog('Something went wrong', error);
        }
        if (onError) {
            onError(error);
        } else if (onClose) {
            onClose();
        }
    };

    const showHints = () => {
        log('\n');
        log('\n');
        log('  To see demo, run the following in other terminal windows:\n');
        log(`    ${chalk.cyan('yarn watch')}                        - watch file changes in /src.`);
        log(`    ${chalk.cyan('http-server -p 5555 --cors -s')}     - run it in ${chalk.yellow('/build')}.`);
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

    detectPort(ganachePort, (error, _port) => {
        if (error) {
            if (onError) {
                onError(error);
            }
            return;
        }

        if (_port !== ganachePort) {
            if (!argv('useExistingGanache')) {
                warnLog(`There is already a process running on port ${ganachePort}`);
                log(`Stop that instance or run ${chalk.cyan('yarn start --useExistingGanache')} to use the same ganache instance.'`);

                if (onClose) {
                    onClose();
                } else {
                    setTimeout(() => {
                        process.exit(0);
                    }, 100);
                }
            }
            return;
        }

        setup({
            onStart: handleStart,
            onError: handleError,
            onClose,
            showHints,
        });
    });
}
