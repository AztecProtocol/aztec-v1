import {
    numberOfNotes,
    numberOfAssets,
    numberOfAccount,
    entityId,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';

const notes = [];
for (let i = 0; i < numberOfNotes; i += 1) {
    const id = entityId('note', i);
    notes.push({
        id,
        hash: id,
        asset: entityId('asset', i % numberOfAssets),
        owner: entityId('account', i % numberOfAccount),
        status: !(i % 7) || !(i % 15) ? 'DESTROYED' : 'CREATED',
    });
}

export const getNotes = (_, args) => {
    const {
        first,
        id_gt: idGt,
    } = args;

    let startAt = 0;
    if (idGt) {
        startAt = notes.findIndex(({ id }) => id === idGt) + 1;
    }

    return notes.slice(startAt, first);
};

const getFetchConditions = makeGetFetchConditions([
    'id',
    'address',
]);

export const getNote = (_, args) => {
    const conditions = getFetchConditions(args);
    return findEntityByKey(notes, conditions);
};

export const getNoteById = noteId => getNote(null, { id: noteId });

export default notes;
