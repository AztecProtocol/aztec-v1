import {
    argsError,
} from '~/utils/error';
import Web3Service from '~/helpers/Web3Service';
import Note from '~/background/database/models/note';
import syncLatestNoteOnChain from './syncLatestNoteOnChain';
import getViewingKeyFromMetadata from './getViewingKeyFromMetadata';

export default async function syncNoteInfo(args) {
    const {
        id: noteId,
    } = args;

    if (!noteId) {
        return null;
    }

    const {
        networkId,
        account: {
            address: currentAddress,
        },
    } = Web3Service;

    let note = await Note.get({ networkId }, noteId);
    if (!note) {
        note = await syncLatestNoteOnChain({
            account: currentAddress,
            noteId,
        });
    }

    if (!note) {
        throw argsError('note.not.found', {
            id: noteId,
        });
    }

    const viewingKey = await getViewingKeyFromMetadata(note.metadata);

    return {
        ...note,
        viewingKey,
    };
}
