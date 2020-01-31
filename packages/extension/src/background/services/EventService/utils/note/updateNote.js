import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';
import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';

export default async function updateNote(note, networkId) {
    let updated;
    try {
        updated = await Note.update(note, { networkId });
    } catch (e) {
        warnLog('Failed to update note in indexedDB', e);
        return null;
    }

    if (updated) {
        const {
            address,
        } = Web3Service.account;

        NoteService.addNotes(
            networkId,
            address,
            [note],
        );
    }

    return updated;
}
