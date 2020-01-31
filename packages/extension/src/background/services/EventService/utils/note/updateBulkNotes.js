import {
    warnLog,
} from '~/utils/log';
import Note from '~/background/database/models/note';
import NoteService from '~/background/services/NoteService';
import Web3Service from '~/helpers/Web3Service';

export default async function updateBulkNotes(notes, networkId) {
    const updatedNotes = [];

    await Promise.all(
        notes.map(async (note) => {
            let updated;
            try {
                updated = await Note.update(note, { networkId });
                updatedNotes.push(note);
            } catch (e) {
                warnLog('Failed to update note in indexedDB', e);
            }
            return updated;
        }),
    );

    if (updatedNotes.length) {
        const {
            address,
        } = Web3Service.account;

        NoteService.addNotes(
            networkId,
            address,
            updatedNotes.filter(({ owner }) => owner === address),
        );
    }

    return updatedNotes;
}
