import * as aztec from 'aztec.js';

export default async function fromViewingKey(viewingKey, owner) {
    const note = await aztec.note.fromViewKey(viewingKey);
    if (note && owner) {
        note.owner = owner;
    }
    return note;
}
