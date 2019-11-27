import {
    terminal,
} from 'terminal-kit';
import chalk from 'chalk';
import ganacheInstance from '../instances/ganacheInstance';
import gsnRelayerInstance from '../instances/gsnRelayerInstance';
import {
    log,
    successLog,
    warnLog,
} from '../utils/log';
import pipeTasks, {
    log as logTask,
} from '../utils/pipeTasks';
import stopProcesses from '../utils/stopProcesses';
import deployContracts from './deployContracts';
import waitUntilGSNRealyerUp from './waitUntilGSNRealyerUp';
import copy from './copy';

export default function setup({
    onStart,
    onError,
    onClose,
    showHints,
} = {}) {
    const runningProcesses = {};
    let confirmClose;

    const doClose = () => {
        if (onClose) {
            onClose(true);
        } else {
            setTimeout(() => {
                process.exit(0);
            }, 100);
        }
    };

    const handleClose = async () => {
        terminal.grabInput(false);
        stopProcesses(runningProcesses, (name) => {
            runningProcesses[name] = null;
        });
    };

    const makeCloseChildProcessCallback = name => () => {
        if (!(name in runningProcesses)) return;

        delete runningProcesses[name];
        successLog(`${name} instance stopped.`);

        if (Object.keys(runningProcesses).length) {
            handleClose();
        } else {
            doClose();
        }
    };

    terminal.grabInput(true);
    terminal.on('key', (key) => {
        switch (key) {
            case 'CTRL_C': {
                if (!confirmClose) {
                    confirmClose = true;
                    warnLog('\nGracefully stopping child processes...\n');
                    log('Press ctrl+c again to force exit.');
                    log("(This may cause some problems when running 'yarn start' again.)\n");
                    handleClose();
                } else {
                    process.exit(0);
                }
                break;
            }
            case 'h':
            case 'H': {
                if (showHints) {
                    showHints();
                }
                break;
            }
            case 'ENTER':
                log('\n');
                break;
            default:
                if (confirmClose) {
                    confirmClose = false;
                }
        }
    });

    const handleError = onError
        || (() => {
            if (onClose) {
                onClose();
            }
        });

    const handleBuildError = () => {
        log('');
        warnLog('Something went wrong');
        log('');
        log(`Please fix the above error and then run ${chalk.cyan('yarn rebuild:contracts')} in another terminal window.`);
        log('');
    };

    const doCloseGSNRelayer = makeCloseChildProcessCallback('gsnRelayer');

    runningProcesses.ganache = ganacheInstance({
        onClose: makeCloseChildProcessCallback('ganache'),
        onError: handleError,
    }).next(async () => {
        runningProcesses.gsnRelayer = await gsnRelayerInstance({
            onClose: (code) => {
                if (code === 0) return;
                doCloseGSNRelayer();
            },
            onError: handleError,
        });
        return runningProcesses.gsnRelayer;
    }).next(() => {
        pipeTasks(
            [
                deployContracts,
                logTask('Successfully deployed contracts to ganache.'),
                waitUntilGSNRealyerUp,
                copy,
            ],
            {
                onError: handleBuildError,
                onClose: (error) => {
                    if (!error && onStart) {
                        onStart(runningProcesses);
                    }
                },
            },
        );
    });
}
