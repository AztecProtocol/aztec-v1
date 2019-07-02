import {
    get,
    set,
} from '~utils/storage';

export default async function pushAssetValue(assetValueKey, noteKey) {
    const prevAssetValueGroup = await get(assetValueKey) || [];
    if (prevAssetValueGroup.indexOf(noteKey) >= 0) return;

    await set({
        [assetValueKey]: [
            ...prevAssetValueGroup,
            noteKey,
        ],
    });
}
