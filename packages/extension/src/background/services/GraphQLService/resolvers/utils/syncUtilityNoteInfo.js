import {
    ONCHAIN_METADATA_AZTEC_DATA_LENGTH,
} from '~config/constants';
import {
    argsError,
} from '~utils/error';
import GraphNodeService from '~background/services/GraphNodeService';

export default async function syncUtilityNoteInfo(args) {
    const {
        id: noteId,
    } = args;

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
        metadata,
    } = note;

    return {
        ...note,
        asset: asset.id,
        metadata: metadata.slice(ONCHAIN_METADATA_AZTEC_DATA_LENGTH + 2),
    };
}
