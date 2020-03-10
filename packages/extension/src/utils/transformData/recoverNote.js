import {
    fromViewingKey,
} from '~/utils/note';

export default async function recoverNote({
    decryptedViewingKey,
    owner,
    metadata,
}) {
    const note = await fromViewingKey(decryptedViewingKey, owner);
    if (metadata) {
        note.setMetaData(metadata);
    }
    return note;
}
