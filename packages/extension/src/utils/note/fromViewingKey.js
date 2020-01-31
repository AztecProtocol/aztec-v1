import {
    note as noteUtils,
} from 'aztec.js';

export default async function fromViewingKey(viewingKey, owner) {
    const note = await noteUtils.fromViewKey(viewingKey);
    if (note && owner) {
        note.owner = owner;
    }
    return note;
}
