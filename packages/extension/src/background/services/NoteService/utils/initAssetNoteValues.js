import noteModel from '~database/models/note';
import {
    get,
} from '~utils/storage';
import {
    isDestroyed,
} from '~utils/noteStatus';

export default async function initAssetNoteValues(assetId, ownerAddress) {
    const noteValues = {};
    const assetKey = await get(assetId);
    const ownerKey = await get(ownerAddress);
    let maxSum = 0;

    await noteModel.each(({
        key,
        asset,
        owner,
        value,
        status,
    }) => {
        if (asset !== assetKey
            || owner !== ownerKey
            || value < 0
            || isDestroyed(status)
        ) {
            return;
        }

        if (!noteValues[value]) {
            noteValues[value] = [];
        }
        noteValues[value].push(key);
        maxSum += value;
    });

    return {
        maxSum,
        noteValues,
    };
}
