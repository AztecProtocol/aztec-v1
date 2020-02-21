/* eslint-disable consistent-return */
/* eslint-disable max-len */
import { spawn } from 'child_process';

import {
    errorLog,
    log,
} from '../utils/log';

export default function taskFactory(
    executable,
    cmd,
    cwd,
    {
        isReadyPredicate = undefined,
        wait = false,
    } = {},
    env = process.env,
) {
    const fn = (args, {
        silent = true,
        waitForReady = !!isReadyPredicate,
        waitForExit = wait,
    } = {}) => new Promise((resolve) => {
        let ready = false;
        log(`######## Spawn ${executable}`);
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
                    log(`######## ${executable} ready`);
                    ready = true;
                    return resolve(shell);
                }
            });


            shell.stderr.on('data', (text) => {

                if (!silent) {
                    errorLog(text.toString());
                }

                if (waitForReady && isReadyPredicate(text.toString()) && !ready) {
                    log(`######## ${executable} ready`);
                    ready = true;
                    return resolve(shell);
                }
            });

            shell.on('close', () => {

                if (waitForExit) {
                    log(`######## ${executable} finished`);
                    return resolve(shell);
                }
            });

            if (!waitForReady && !waitForExit) {
                return resolve(shell);
            }
        } catch (e) {
            errorLog(`${executable} failed to spawn`);
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
