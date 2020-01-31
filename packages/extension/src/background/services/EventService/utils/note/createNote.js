import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';
import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';

export default async function createNote(note, networkId) {
    let newNote;
    try {
        newNote = await Note.add(note, { networkId });
    } catch (e) {
        warnLog('Failed to create a note in indexedDB', e);
        return null;
    }

    if (newNote) {
        const {
            address,
        } = Web3Service.account;

        if (newNote.owner === address) {
            NoteService.addNotes(
                networkId,
                address,
                [note],
            );
        }
    }

    return newNote;
}
