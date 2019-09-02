import {
    get,
    set,
    lock,
} from '~utils/storage';
import {
    encryptMessage,
} from '~utils/crypto';
import dataKey from '~utils/dataKey';
import asyncForEach from '~utils/asyncForEach';
import saveUserAssetNotes from './saveUserAssetNotes';

export default async function saveToStorage(userAddress, linkedPublicKey, assetNoteDataMappinig) {
    const assetSummary = {};
    await asyncForEach(Object.keys(assetNoteDataMappinig), async (assetId) => {
        const {
            balance,
            lastSynced,
        } = assetNoteDataMappinig[assetId];
        const encryptedBalance = await encryptMessage(linkedPublicKey, `${balance}`);
        assetSummary[assetId] = {
            balance: encryptedBalance.toHexString(),
            lastSynced,
        };
    });

    const userAssetsKey = dataKey('userAssets', {
        user: userAddress,
    });

    await lock(userAssetsKey, async () => {
        const prevAssets = await get(userAssetsKey);
        const mergedAssets = {
            ...prevAssets,
            ...assetSummary,
        };
        await set({
            [userAssetsKey]: mergedAssets,
        });
    });

    const assetNotesPromises = Object.keys(assetNoteDataMappinig)
        .map(assetId => saveUserAssetNotes(
            userAddress,
            linkedPublicKey,
            assetId,
            assetNoteDataMappinig[assetId].noteValues,
        ));

    await Promise.all(assetNotesPromises);
}
