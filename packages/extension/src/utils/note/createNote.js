import aztec from 'aztec.js';

export default async function createNote(value, publicKey, owner) {
    return aztec.note.create(publicKey, value, owner);
}
