import {
    entityId,
} from '../config';
import randomInt from '../utils/randomInt';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';
import fetchFromData from '../utils/fetchFromData';
import notes, {
    getNoteById,
    updateNote,
} from './note';
import accounts from './account';
import metadata from '../../src/utils/metadata';

const noteAccess = [];
const noteChangeLogs = [];
const toBeDestroyed = [];
let timestamp = Date.now();

const createAccessForAccount = (note, accountAddress, viewingKey) => {
    const accessIndex = noteAccess.length;
    const accessId = entityId('access', timestamp);
    timestamp += randomInt(0, 60000);
    const account = accounts.find(({
        address,
    }) => address === accountAddress);

    noteAccess.push({
        id: accessId,
        note: note.id,
        account: account.id,
        viewingKey,
        timestamp,
    });

    noteChangeLogs.push({
        id: entityId('log', `${noteChangeLogs.length}`.padStart(3, '0')),
        account: account.id,
        noteAccess: accessId,
        action: 'CREATE',
        timestamp,
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
    timestamp += randomInt(0, 2000);
    access.timestamp = timestamp;

    noteChangeLogs.push({
        id: entityId('log', `${noteChangeLogs.length}`.padStart(3, '0')),
        account: access.account,
        noteAccess: access.id,
        action: 'DESTROY',
        timestamp,
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
    'timestamp',
];

export const getNoteAccesses = (_, args) => fetchFromData(
    noteAccessesWherePrefixes,
    noteAccess,
    args,
);

const noteChangeLogsWherePrefixes = [
    'id',
    'account',
];

export const getNoteChangeLogs = (_, args) => fetchFromData(
    noteChangeLogsWherePrefixes,
    noteChangeLogs,
    args,
);

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
