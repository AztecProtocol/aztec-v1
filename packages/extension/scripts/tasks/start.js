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
        log('  Run the following commands in another terminal window:\n');
        log(`    ${chalk.cyan('yarn test:run')}          - run all the tests using this setup.`);
        log(`    ${chalk.cyan('yarn rebuild:contracts')} - migrate contracts and copy files`);
        log('\n');
        log('    Sub-tasks of rebuild:');
        log(`    ${chalk.magenta('yarn deploy:contracts')}  - migrate contracts.`);
        log(`    ${chalk.magenta('yarn copy:contracts')}    - copy contracts, abis, and addresses to this package.`);
        log('\n');
        log('    To test a specific file:');
        log(`    ${chalk.magenta('jest [FILE_NAME]')}`);
        log('\n');
        log(`  Press ${chalk.yellow('h')} to show the above hints again.`);
        log('\n');
        log('\n');
    };

    const handleStart = () => {
        log('\n');
        log('\n');
        log(`${chalk.green('✔')} Contracts were deployed, artifacts moved, birds are chirping, everything is perfect!`);
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
