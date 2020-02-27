import ConnectionService from '~/client/services/ConnectionService';
import ZkNote from './ZkNote';

export default async function noteFactory(noteId) {
    let note;
    try {
        note = await ConnectionService.query(
            'note',
            { id: noteId },
        );
    } catch (error) {
        if (error.key !== 'note.not.found') {
            throw error;
        }
    }

    return new ZkNote({
        ...note,
        id: noteId,
    });
}
