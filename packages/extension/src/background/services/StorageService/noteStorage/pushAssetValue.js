import {
    get,
    set,
    lock,
} from '~utils/storage';

export default async function pushAssetValue(assetValueKey, noteKey) {
    await lock(assetValueKey, async () => {
        const prevAssetValueGroup = await get(assetValueKey) || [];
        if (prevAssetValueGroup.indexOf(noteKey) >= 0) return;

        await set({
            [assetValueKey]: [
                ...prevAssetValueGroup,
                noteKey,
            ],
        });
    });
}
