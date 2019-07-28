import aztec from 'aztec.js';

export default async function fromViewingKey(viewingKey) {
    return aztec.note.fromViewKey(viewingKey);
}
