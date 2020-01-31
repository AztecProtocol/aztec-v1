import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';
import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';

export default async function createBulkNotes(notes, networkId) {
    let created;
    try {
        created = await Note.bulkAdd(notes, { networkId });
    } catch (e) {
        // TODO - some of the notes might be valid, create them individually
        warnLog('Failed to create notes in indexedDB', e);
        return null;
    }

    if (created && created.length) {
        const {
            address,
        } = Web3Service.account;

        NoteService.addNotes(
            networkId,
            address,
            notes.filter(({ owner }) => owner === address),
        );
    }

    return created;
}
