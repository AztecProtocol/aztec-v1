import {
    get,
} from '~/utils/storage';
import {
    batchDecrypt,
    fromHexString,
} from '~/utils/crypto';
import dataKey from '~/utils/dataKey';
import recoverAssetNotesFromStorage from './recoverAssetNotesFromStorage';

export default async function recoverFromStorage(
    version,
    networkId,
    owner,
) {
    const {
        address: userAddress,
        linkedPrivateKey,
    } = owner;
    const encryptedSummary = await get(dataKey('userAssets', {
        version,
        user: userAddress,
        network: networkId,
    })) || {};
    const encryptedBalances = Object.values(encryptedSummary)
        .map(({ balance }) => fromHexString(balance));
    const balances = batchDecrypt(linkedPrivateKey, encryptedBalances);
    const assetSummary = {};
    Object.keys(encryptedSummary).forEach((assetId, i) => {
        assetSummary[assetId] = {
            ...encryptedSummary[assetId],
            balance: parseInt(balances[i] || 0, 10),
        };
    });

    const priority = await get(dataKey('userAssetPriority', {
        version,
        user: userAddress,
        network: networkId,
    })) || [];

    const assetNotes = {};
    await Promise.all(priority
        .map(async (assetId) => {
            assetNotes[assetId] = await recoverAssetNotesFromStorage(
                version,
                networkId,
                owner,
                assetId,
            );
        }));

    return {
        assetSummary,
        assetNotes,
        priority,
    };
}
