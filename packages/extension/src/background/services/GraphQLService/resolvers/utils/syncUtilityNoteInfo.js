import {
    argsError,
} from '~utils/error';
import EventService from '~background/services/EventService';


export default async function syncUtilityNoteInfo(args, ctx = {}) {
    const {
        id: noteHash,
    } = args;

    const {
        // TODO: remove default value, when it will be passed here.
        networkId = 0,
    } = ctx;

    console.log(`------ Note syncUtilityNoteInfo`);

    if (!noteHash) {
        return null;
    }

    let note;
    ({
        note,
    } = await EventService.fetchLatestNote({
        noteHash,
        networkId,
    }));

    if (!note) {
        throw argsError('utilityNote.not.found.onChain', {
            messageOptions: {
                id: noteHash,
            },
        });
    }

    const {
        metadata,
        asset: assetAddress,
    } = note;

    note = {
        id: noteHash,
        hash: noteHash,
        metadata,
        asset: {
            id: assetAddress,
        },
    };

    const {
        asset,
    } = note;

    return {
        ...note,
        asset: asset.id,
    };
}
