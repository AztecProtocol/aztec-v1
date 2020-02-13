import {
    set,
} from '~/utils/storage';
import dataKey from '~/utils/dataKey';
import {
    encryptMessage,
} from '~/utils/crypto';

export default async function saveAssetNotesToStorage(
    version,
    networkId,
    userAddress,
    linkedPublicKey,
    assetId,
    noteValues,
) {
    const storageKey = dataKey('userAssetNotes', {
        version,
        user: userAddress,
        asset: assetId,
        network: networkId,
    });

    const encryptedAssetNotes = [];
    Object.keys(noteValues).forEach((value) => {
        if (!noteValues[value].length) return;
        const data = [
            value,
            ...noteValues[value],
        ];
        encryptedAssetNotes.push(encryptMessage(linkedPublicKey, data.join('')));
    });
    const assetNotes = encryptedAssetNotes.map(encrypted => encrypted.toHexString());

    await set({
        [storageKey]: assetNotes,
    });
}
