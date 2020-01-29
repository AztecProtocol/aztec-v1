// eslint-disable-next-line camelcase
const child_process = require('child_process');
const path = require('path');
const Promise = require('bluebird');

function cmdStatus(umzug) {
    const result = {};

    return umzug
        .executed()
        .then((executed) => {
            result.executed = executed;
            return umzug.pending();
        })
        .then((pending) => {
            result.pending = pending;
            return result;
        })
        .then(({ executed: executedRaw, pending: pendingRaw }) => {
            const executed = executedRaw.map((m) => ({
                ...m,
                name: path.basename(m.file, '.js'),
            }));
            const pending = pendingRaw.map((m) => ({
                ...m,
                name: path.basename(m.file, '.js'),
            }));

            const current = executed.length > 0 ? executed[0].file : '<NO_MIGRATIONS>';
            const status = {
                current,
                executed: executed.map((m) => m.file),
                pending: pending.map((m) => m.file),
            };

            console.log(JSON.stringify(status, null, 2));
            return { executed, pending };
        });
}

function cmdMigrate(umzug) {
    return umzug.up();
}

function cmdMigrateNext(umzug) {
    return cmdStatus(umzug).then(({ executed, pending }) => {
        if (pending.length === 0) {
            return Promise.reject(new Error('No pending migrations'));
        }
        const next = pending[0].name;
        return umzug.up({ to: next });
    });
}

function cmdReset(umzug) {
    return umzug.down({ to: 0 });
}

function cmdResetPrev(umzug) {
    return cmdStatus(umzug).then(({ executed }) => {
        if (executed.length === 0) {
            return Promise.reject(new Error('Already at initial state'));
        }
        const prev = executed[executed.length - 1].name;
        return umzug.down({ to: prev });
    });
}

function cmdHardReset() {
    return new Promise((resolve, reject) => {
        setImmediate(() => {
            try {
                console.log('dropdb');
                child_process.spawnSync('dropdb');
                console.log('createdb');
                child_process.spawnSync('createdb');
                resolve();
            } catch (e) {
                console.log(e);
                reject(e);
            }
        });
    });
}

module.exports = (cmd) => {
    let executeCmd;
    switch (cmd) {
        case 'status':
            executeCmd = cmdStatus;
            break;

        case 'up':
        case 'migrate':
            executeCmd = cmdMigrate;
            break;

        case 'next':
        case 'migrate-next':
            executeCmd = cmdMigrateNext;
            break;

        case 'down':
        case 'reset':
            executeCmd = cmdReset;
            break;

        case 'prev':
        case 'reset-prev':
            executeCmd = cmdResetPrev;
            break;

        case 'reset-hard':
            executeCmd = cmdHardReset;
            break;

        default:
            executeCmd = null;
    }
    return executeCmd;
};
