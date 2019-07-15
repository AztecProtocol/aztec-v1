import {
    entityId,
} from '../config';
import randomInt from '../utils/randomInt';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';
import filterByWhere from '../utils/filterByWhere';
import notes, {
    getNoteById,
    updateNote,
} from './note';
import accounts from './account';
import metadata from '../../src/utils/metadata';

const noteAccess = [];
const noteChangeLog = [];
const toBeDestroyed = [];
let prevTimestamp = Date.now() - 86400;

const createAccessForAccount = (note, accountAddress, viewingKey) => {
    const accessIndex = noteAccess.length;
    const accessId = entityId('access', accessIndex);
    prevTimestamp += randomInt(0, 60000);
    const account = accounts.find(({
        address,
    }) => address === accountAddress);

    noteAccess.push({
        id: accessId,
        note: note.id,
        account: account.id,
        viewingKey,
    });

    noteChangeLog.push({
        id: entityId('log', noteChangeLog.length),
        account: account.id,
        noteAccess: accessId,
        action: 'CREATE',
        timestamp: Math.ceil(prevTimestamp / 1000),
    });

    if (note.status === 'DESTROYED') {
        toBeDestroyed.push(accessIndex);
    }
};

notes.forEach((note) => {
    const {
        metadata: metadataStr,
    } = note;
    const {
        addresses,
        viewingKeys,
    } = metadata(metadataStr);
    addresses.forEach((address, i) => {
        const viewingKey = viewingKeys[i];
        createAccessForAccount(note, address, viewingKey);
    });
});

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

const getFetchConditions = makeGetFetchConditions([
    'id',
]);

export const getNoteAccess = (_, args) => {
    const {
        noteId,
        account,
    } = args;
    if (noteId && account) {
        return noteAccess.find(n => n.note === noteId && n.account === account);
    }

    const conditions = getFetchConditions(args);
    return findEntityByKey(noteAccess, conditions);
};

export const getNoteAccessById = noteAccessId => getNoteAccess(null, { id: noteAccessId });

const noteAccessesWherePrefixes = [
    'note',
    'account',
];

export const getNoteAccesses = (_, args) => {
    const {
        first,
        where,
    } = args;

    const filteredAccess = filterByWhere(
        where,
        noteAccessesWherePrefixes,
        noteAccess,
    );

    return filteredAccess.slice(0, first);
};

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

export const grantAccess = (noteId, metadataStr) => {
    const note = getNoteById(noteId);
    if (!note) {
        return false;
    }

    const {
        metadata: prevMetadataStr,
    } = note;
    const {
        addresses: prevAddresses,
    } = metadata(prevMetadataStr);
    const {
        addresses,
        viewingKeys,
    } = metadata(metadataStr);

    for (let i = prevAddresses.length; i < addresses.length; i += 1) {
        createAccessForAccount(note, addresses[i], viewingKeys[i]);
    }

    return !!updateNote(noteId, { metadata: metadataStr });
};

export default noteAccess;
