/* eslint-disable consistent-return */
/* eslint-disable max-len */
import { spawn } from 'child_process';

import {
    errorLog,
    log,
} from '../utils/log';

/**
 * @description Factory function for tasks
 * @param {string} executable name of the executable this task should launch
 * @param {string} cmd top level command to the executable
 * @param {string} cwd working dir this task will get executed in
 * @param {Function} param.isReadyPredicate function which only returns true if a particular
 * condition is reached
 * @param {bool} param.wait determines if promise only resolves if task exits
 * @param {bool} param.interactive determines if task will allow user input
 * @param {object} env object of environment variables
 *
 * @returns {object} Task
 * @returns {Function} Task.launch function to launch the task
 * @returns {string} Task.executable name of executable
 * @returns {string} Task.cmd top level command to the executable
 * @returns {string} Task.cwd working dir this task will get executed in
 */
export default function taskFactory(
    executable,
    cmd,
    cwd,
    {
        isReadyPredicate = undefined,
        wait = false,
        interactive = false,
    } = {},
    env = process.env,
) {
    const fn = (args, {
        silent = true,
        waitForReady = !!isReadyPredicate,
        waitForExit = wait,
    } = {}) => new Promise((resolve) => {
        let ready = false;
        log(`> Spawn ${executable} ${cmd}...`);
        try {
            const shell = spawn(
                `${executable} ${cmd}`,
                args,
                {
                    shell: true,
                    cwd,
                    env,
                },
            );

            shell.stdout.on('data', (text) => {

                if (!silent) {
                    log(text.toString());
                }

                if (waitForReady && isReadyPredicate(text.toString()) && !ready) {
                    log(`> ${executable} ready!`);
                    ready = true;
                    return resolve(shell);
                }
            });

            if (interactive) {
                process.stdin.on('data', (text) => {
                    shell.stdin.write(text.toString());
                });
            }

            shell.stderr.on('data', (text) => {
                if (!silent) {
                    errorLog(text.toString());
                }

                if (waitForReady && isReadyPredicate(text.toString()) && !ready) {
                    log(`> ${executable} ready!`);
                    ready = true;
                    return resolve(shell);
                }
            });

            shell.on('close', () => {
                if (waitForExit) {
                    log(`> ${executable} finished!`);
                    return resolve(shell);
                }
            });

            if (!waitForReady && !waitForExit) {
                return resolve(shell);
            }
        } catch (e) {
            errorLog(`> ${executable} failed to spawn...`);
            errorLog(e);
        }
    });

    return {
        launch: fn,
        executable,
        cmd,
        cwd,
    };
}
