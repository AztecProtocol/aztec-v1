import assetModel from '~database/models/asset';
import noteModel from '~database/models/note';
import {
    argsError,
} from '~utils/error';
import asyncMap from '~utils/asyncMap';
import NoteService from '~background/services/NoteService';
import settings from '~background/utils/settings';

export default async function pickNotesFromBalance(args, ctx) {
    const {
        assetId,
        amount,
        owner,
        numberOfNotes,
    } = args;
    const {
        address: userAddress,
        networkId
    } = ctx;

    const asset = await assetModel.get({
        id: assetId,
    });

    if (!asset) {
        throw argsError('asset.notFound', {
            messageOptions: {
                asset: assetId,
            },
        });
    }

    const noteKeys = await NoteService.pick(
        owner || userAddress,
        assetId,
        amount,
        {
            numberOfNotes: numberOfNotes || await settings('NUMBER_OF_INPUT_NOTES'),
        },
    );

    const notes = await asyncMap(
        noteKeys,
        async noteKey => noteModel.get({ key: noteKey }),
    );

    return notes;
}
