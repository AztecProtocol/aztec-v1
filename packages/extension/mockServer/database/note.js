import {
    numberOfNotes,
    numberOfAssets,
    numberOfAccount,
    entityId,
    viewingKeyLength,
} from '../config';
import {
    makeGetFetchConditions,
} from '../utils/getFetchConditions';
import findEntityByKey from '../utils/findEntityByKey';
import {
    toString,
} from '../../src/utils/metadata';
import generateRandomId from '../utils/generateRandomId';
import accounts from './account';
import assets from './asset';

const generateRandomMetadata = (noteIndex, ownerIndex) => {
    const owner = accounts[ownerIndex];
    const shareAccessWith = [
        owner.address,
    ];
    if (noteIndex % 2) {
        const offset = (noteIndex * ownerIndex) % (numberOfAccount - 1);
        const shareWithIndex = (ownerIndex + offset) % numberOfAccount;
        shareAccessWith.push(accounts[shareWithIndex].address);
    }

    return toString({
        aztecData: generateRandomId(33),
        addresses: shareAccessWith.join(''),
        viewingKeys: shareAccessWith
            .map(() => generateRandomId(viewingKeyLength))
            .join(''),
    });
};

const notes = [];
for (let i = 0; i < numberOfNotes; i += 1) {
    const id = entityId('note', i);
    const ownerIndex = i % numberOfAccount;
    const assetIndex = i % numberOfAssets;

    notes.push({
        id,
        hash: id,
        asset: assets[assetIndex].id,
        owner: accounts[ownerIndex].id,
        metadata: generateRandomMetadata(i, ownerIndex),
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

const ableToUpdate = [
    'metadata',
];

export const updateNote = (noteId, newData) => {
    const note = getNoteById(noteId);
    if (!note) {
        return null;
    }

    Object.keys(newData)
        .filter(field => ableToUpdate.indexOf(field) >= 0)
        .forEach((field) => {
            note[field] = newData[field];
        });

    return note;
};

export default notes;
