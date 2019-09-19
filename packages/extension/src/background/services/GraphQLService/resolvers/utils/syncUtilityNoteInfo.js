import {
    argsError,
} from '~utils/error';
import GraphNodeService from '~background/services/GraphNodeService';

export default async function syncUtilityNoteInfo(args) {
    const {
        id: noteId,
    } = args;

    console.log(`------ Note syncUtilityNoteInfo`);

    if (!noteId) {
        return null;
    }

    const {
        note,
    } = await GraphNodeService.query(`
        note: utilityNote(id: "${noteId}") {
            id
            hash
            metadata
            asset {
                id
            }
        }
    `);

    if (!note) {
        throw argsError('utilityNote.not.found.onChain', {
            messageOptions: {
                id: noteId,
            },
        });
    }

    const {
        asset,
    } = note;

    return {
        ...note,
        asset: asset.id,
    };
}
