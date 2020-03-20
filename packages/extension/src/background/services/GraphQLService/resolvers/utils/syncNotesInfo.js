import {
    argsError,
} from '~/utils/error';
import syncNoteInfo from './syncNoteInfo';

export default async function syncNotesInfo(args) {
    const {
        where: {
            noteHash_in: noteHashes,
            // TODO
            // should support more filters
        },
    } = args;


    const notes = [];
    const invalidNoteHashes = [];
    await Promise.all(noteHashes.map(async (noteHash) => {
        try {
            const note = await syncNoteInfo({
                id: noteHash,
            });
            if (note) {
                notes.push(note);
            } else {
                invalidNoteHashes.push(noteHash);
            }
        } catch (e) {
            invalidNoteHashes.push(noteHash);
        }
    }));

    if (invalidNoteHashes.length > 0) {
        throw argsError('note.not.found', {
            id: invalidNoteHashes[0],
            noteHashes: invalidNoteHashes,
        });
    }

    return notes;
}
