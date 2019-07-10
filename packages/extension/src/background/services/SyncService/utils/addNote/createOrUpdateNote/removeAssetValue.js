import {
    get,
    set,
    lock,
} from '~utils/storage';

export default async function removeAssetValue(assetValueKey, noteKey) {
    await lock(assetValueKey, async () => {
        const prevAssetValueGroup = await get(assetValueKey) || [];
        const assetValueGroup = [...prevAssetValueGroup];
        const toRemove = prevAssetValueGroup.findIndex(n => n === noteKey);
        if (toRemove < 0) return;

        assetValueGroup.splice(toRemove, 1);
        await set({
            [assetValueKey]: assetValueGroup,
        });
    });
}
