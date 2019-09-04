import {
    get,
} from '~utils/storage';
import dataKey from '~utils/dataKey';
import {
    batchDecrypt,
    fromHexString,
} from '~utils/crypto';
import parseNoteValuesStrings from './parseNoteValuesStrings';

export default async function recoverFromStorage(userAddress, linkedPrivateKey) {
    const userAssetsKey = dataKey('userAssets', {
        user: userAddress,
    });
    const userAssets = await get(userAssetsKey) || {};

    const assetNoteDataMapping = {};
    await Promise.all(Object.keys(userAssets)
        .map(async (assetId) => {
            const userAsset = userAssets[assetId];
            const assetNotesKey = dataKey('userAssetNotes', {
                user: userAddress,
                asset: assetId,
            });
            const assetNotes = await get(assetNotesKey);
            const encryptedData = [
                userAsset.balance,
                ...assetNotes,
            ].map(fromHexString);
            const [
                balance,
                ...noteValues
            ] = batchDecrypt(linkedPrivateKey, encryptedData);

            assetNoteDataMapping[assetId] = {
                ...userAsset,
                balance: parseInt(balance, 10),
                noteValues: parseNoteValuesStrings(noteValues),
            };
        }));

    return assetNoteDataMapping;
}
