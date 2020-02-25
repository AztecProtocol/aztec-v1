import {
    log,
    successLog,
    warnLog,
    errorLog,
} from './utils/log';

function run(fn, options) {
    const task = (typeof fn.default === 'undefined') ? fn : fn.default;
    successLog(`Start running '${task.name}${options.length ? ` ${options.join(' ')}` : ''}'...`);
    const startTime = Date.now();

    return task.run()
        .then(() => {
            const diff = Date.now() - startTime;
            successLog(`\nFinished '${task.name}' in ${diff} ms.`);
        })
        .catch((error) => {
            if (error) {
                log(error);
            }

            warnLog(`\nFailed to run '${task.name}${options.length ? ` ${options.join(' ')}` : ''}'.`);
        });
}

if (process.argv.length > 2) {
    delete require.cache[__filename]; // eslint-disable-line no-underscore-dangle

    const taskName = process.argv[2];
    const module = require(`./scenarios/${taskName}`).default; // eslint-disable-line
    run(module, process.argv.slice(3)).catch(err => errorLog(err.stack));
}
