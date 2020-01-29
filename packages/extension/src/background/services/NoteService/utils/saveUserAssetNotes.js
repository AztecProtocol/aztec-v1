import {
    set,
} from '~/utils/storage';
import dataKey from '~/utils/dataKey';
import {
    encryptMessage,
} from '~/utils/crypto';

export default async function saveUserAssetNotes(
    userAddress,
    linkedPublicKey,
    assetId,
    noteValues,
) {
    const storageKey = dataKey('userAssetNotes', {
        user: userAddress,
        asset: assetId,
    });

    const encryptedAssetNotes = await Promise.all(Object.keys(noteValues)
        .map((value) => {
            const data = [
                value,
                ...noteValues[value],
            ];
            return encryptMessage(linkedPublicKey, data.join(''));
        }));
    const assetNotes = encryptedAssetNotes.map(encrypted => encrypted.toHexString());

    await set({
        [storageKey]: assetNotes,
    });
}
