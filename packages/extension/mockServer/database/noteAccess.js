import {
    numberOfNoteAccess,
    numberOfNotes,
    numberOfAccount,
    entityId,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';

const noteAccess = [];
const noteChangeLog = [];
let prevDestroyedId = -1;
for (let i = 0; i < numberOfNoteAccess; i += 1) {
    const accessId = entityId('note_access', i);
    const accountId = entityId('account', i % numberOfAccount);

    noteAccess.push({
        id: accessId,
        note: entityId('note', i % numberOfNotes),
        account: accountId,
        sharedSecret: `secret_${i}`,
    });

    noteChangeLog.push({
        id: entityId('log', noteChangeLog.length),
        account: accountId,
        noteAccess: accessId,
        action: 'CREATE',
        timestamp: Math.ceil(Date.now() / 1000),
    });

    if (!(i % 7) || !(i % 15)) {
        prevDestroyedId += 1;
        const noteToDestroy = noteAccess[prevDestroyedId];
        noteChangeLog.push({
            id: entityId('log', noteChangeLog.length),
            account: noteToDestroy.account,
            noteAccess: noteToDestroy.id,
            action: 'DESTROY',
            timestamp: Math.ceil(Date.now() / 1000),
        });
    }
}

export const getNoteAccesses = (_, args) => {
    const {
        first,
        account,
        id_gt: idGt,
    } = args;

    let filteredAccess = noteAccess;
    if (account) {
        filteredAccess = noteAccess.filter(n => n.account === account);
    }

    let startAt = 0;
    if (idGt) {
        startAt = filteredAccess.findIndex(({ id }) => id === idGt) + 1;
    }

    return filteredAccess.slice(startAt, first);
};

const getFetchConditions = makeGetFetchConditions([
    'id',
    'account',
]);

export const getNoteAccess = (_, args) => {
    const conditions = getFetchConditions(args);
    return findEntityByKey(noteAccess, conditions);
};

export const getNoteAccessById = noteAccessId => getNoteAccess(null, { id: noteAccessId });

export const getNoteChangeLog = (_, args) => {
    const {
        first,
        account,
        id_gt: idGt,
    } = args;

    let filteredLog = noteChangeLog;
    if (account) {
        filteredLog = filteredLog.filter(n => n.account === account);
    }

    let startAt = 0;
    if (idGt) {
        startAt = filteredLog.findIndex(({ id }) => id === idGt) + 1;
    }

    return filteredLog.slice(startAt, startAt + first);
};

export default noteAccess;
