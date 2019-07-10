import {
    numberOfNoteAccess,
    numberOfNotes,
    numberOfAccount,
    entityId,
} from '../config';
import randomInt from '../utils/randomInt';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';
import notes from './note';

const noteAccess = [];
const noteChangeLog = [];
const toBeDestroyed = [];
let prevTimestamp = Date.now();
for (let i = 0; i < numberOfNoteAccess; i += 1) {
    const accessId = entityId('note_access', i);
    const accountId = entityId('account', i % numberOfAccount);
    const noteIndex = i % numberOfNotes;
    const note = notes[noteIndex];
    prevTimestamp += randomInt(0, 2000);

    noteAccess.push({
        id: accessId,
        note: entityId('note', noteIndex),
        account: accountId,
        sharedSecret: `secret_${i}`,
    });

    noteChangeLog.push({
        id: entityId('log', noteChangeLog.length),
        account: accountId,
        noteAccess: accessId,
        action: 'CREATE',
        timestamp: Math.ceil(prevTimestamp / 1000),
    });

    if (note.status === 'DESTROYED') {
        toBeDestroyed.push(i);
    }
}

toBeDestroyed.forEach((accessIndex) => {
    const access = noteAccess[accessIndex];
    prevTimestamp += randomInt(0, 2000);
    noteChangeLog.push({
        id: entityId('log', noteChangeLog.length),
        account: access.account,
        noteAccess: access.id,
        action: 'DESTROY',
        timestamp: Math.ceil(prevTimestamp / 1000),
    });
});

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
