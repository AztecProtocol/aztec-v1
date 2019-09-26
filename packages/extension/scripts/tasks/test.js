import detectPort from 'detect-port';
import chalk from 'chalk';
import {
    log,
    warnLog,
    errorLog,
} from '../utils/log';
import stopProcesses from '../utils/stopProcesses';
import instance from '../utils/instance';
import {
    argv,
} from '../utils/cmd';
import handleErrorOutputAsNormal from '../utils/handleErrorOutputAsNormal';
import {
    getPort,
} from '../instances/ganacheInstance';
import setup from './setup';

export default function test({
    onError,
    onClose,
} = {}) {
    let runningProcesses;
    const ganachePort = getPort();

    const handleFinishTest = async () => {
        if (argv('stayOpen')) {
            log(`\nRun ${chalk.cyan('yarn test:run')} in another terminal window to run the tests using this setup.\n`);
            return;
        }
        if (runningProcesses) {
            stopProcesses(runningProcesses, (name) => {
                runningProcesses[name] = null;
            });
        } else if (onClose) {
            onClose();
        } else {
            setTimeout(() => {
                process.exit(0);
            }, 100);
        }
    };

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

    const runTest = (processes) => {
        runningProcesses = processes;
        instance(
            'jest ./tests',
            {
                onReceiveErrorOutput: handleErrorOutputAsNormal,
                onClose: handleFinishTest,
            },
        );
    };

    detectPort(ganachePort, (error, _port) => {
        if (error) {
            if (onError) {
                onError(error);
            }
            return;
        }

        if (_port !== ganachePort) {
            if (argv('useExistingGanache')) {
                runTest();
            } else {
                warnLog(`There is already a process running on port ${ganachePort}`);
                log(`Stop that instance or run ${chalk.cyan('yarn test:run')} in another terminal window.`);
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
            onStart: runTest,
            onError: handleError,
            onClose,
        });
    });
}
