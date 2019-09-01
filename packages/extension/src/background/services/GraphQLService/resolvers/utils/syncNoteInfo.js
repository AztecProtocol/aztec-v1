import {
    get,
} from '~utils/storage';
import Note from '~database/models/note';
import SyncService from '~background/services/SyncService';

export default async function syncNoteInfo(noteId, ctx) {
    const {
        user: {
            address: userAddress,
        },
    } = ctx;

    let note = await Note.get({
        id: noteId,
    });
    let userKey;
    if (note) {
        userKey = await get(userAddress);
    }
    if (!note
        || note.owner !== userKey
    ) {
        note = await SyncService.syncNote({
            address: userAddress,
            noteId,
        });

        // TODO: check permission to asset
    }

    return note;
}
