import {
    get,
    set,
    lock,
} from '~/utils/storage';
import {
    batchEncrypt,
} from '~/utils/crypto';
import dataKey from '~/utils/dataKey';
import saveAssetNotesToStorage from './saveAssetNotesToStorage';

export default async function saveToStorage(
    version,
    networkId,
    owner,
    userAssetsData,
) {
    const {
        address: userAddress,
        linkedPublicKey,
    } = owner;
    const {
        assetSummary,
        assetNotes,
        priority,
    } = userAssetsData;

    const balanceStrings = Object.values(assetSummary)
        .map(({ balance }) => `${balance}`);
    const encryptedBalances = batchEncrypt(linkedPublicKey, balanceStrings);
    const encryptedSummary = {};
    Object.keys(assetSummary).forEach((assetId, i) => {
        const {
            size,
            lastSynced,
        } = assetSummary[assetId];
        encryptedSummary[assetId] = {
            balance: encryptedBalances[i].toHexString(),
            size,
            lastSynced,
        };
    });

    const userAssetsKey = dataKey('userAssets', {
        version,
        user: userAddress,
        network: networkId,
    });
    await lock(userAssetsKey, async () => {
        const prevSummary = await get(userAssetsKey);
        const mergedSummary = {
            ...prevSummary,
            ...encryptedSummary,
        };
        await set({
            [userAssetsKey]: mergedSummary,
        });
    });

    if (priority) {
        const priorityDataKey = dataKey(
            'userAssetPriority',
            {
                version,
                user: userAddress,
                network: networkId,
            },
        );
        await set({
            [priorityDataKey]: priority,
        });
    }

    const assetNotesPromises = Object.keys(assetNotes)
        .map(assetId => saveAssetNotesToStorage(
            version,
            networkId,
            userAddress,
            linkedPublicKey,
            assetId,
            assetNotes[assetId],
        ));

    await Promise.all(assetNotesPromises);
}
