import {
    log,
} from './log';

export default function stopProcesses(processes, cb) {
    Object.keys(processes)
        .forEach((name) => {
            const cp = processes[name];
            if (!cp) return;

            log(`Stopping ${name}...`);
            if (typeof cp.clear === 'function') {
                cp.clear();
            } else {
                cp.kill();
            }

            if (cb) {
                cb(name, cp);
            }
        });
}
