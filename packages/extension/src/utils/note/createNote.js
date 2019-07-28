import aztec from 'aztec.js';

export default async function createNote(value, publicKey, owner) {
    if (!value) {
        const note = aztec.note.createZeroValueNote();
        if (owner) {
            note.owner = owner;
        }
        return note;
    }
    return aztec.note.create(publicKey, value, owner);
}
