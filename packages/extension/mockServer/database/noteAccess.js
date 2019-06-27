import {
    numberOfNoteAccess,
    numberOfNotes,
    numberOfAccount,
    entityId,
} from '../config';

const noteAccess = [];
for (let i = 0; i < numberOfNoteAccess; i += 1) {
    noteAccess.push({
        id: entityId('note_access', i),
        note: entityId('note', i % numberOfNotes),
        account: entityId('account', i % numberOfAccount),
        sharedSecret: `secret_${i}`,
    });
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

export default noteAccess;
