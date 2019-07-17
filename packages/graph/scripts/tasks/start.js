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
        log(`    ${chalk.cyan('yarn test:run')} - run all the tests using this setup.`);
        log(`    ${chalk.cyan('yarn graph')}    - deploy graph node.`);
        log(`    ${chalk.cyan('yarn rebuild')}  - migrate contracts, copy files, and deploy graph node.`);
        log('\n');
        log('  See GraphQL explorer in the following url:\n');
        log(`    ${chalk.cyan('http://127.0.0.1:8000/subgraphs/name/aztec/note-management/')}`);
        log('\n');
        log('\n');
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
            onStart: showHints,
            onError: handleError,
            onClose,
        });
    });
}
