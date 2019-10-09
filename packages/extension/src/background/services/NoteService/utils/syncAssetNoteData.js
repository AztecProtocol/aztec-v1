import noteModel from '~database/models/note';
import assetModel from '~database/models/asset';
import addressModel from '~database/models/address';
import {
    errorLog,
} from '~utils/log';
import {
    fromHexString,
} from '~utils/encryptedViewingKey';
import {
    valueFromViewingKey,
    valueOf,
} from '~utils/note';
import {
    isDestroyed,
} from '~utils/noteStatus';

export default async function syncAssetNoteData(
    ownerAddress,
    linkedPrivateKey,
    assetId,
    lastSynced = null,
) {
    const noteValues = {};
    const ownerKey = await addressModel.keyOf(ownerAddress);
    const assetKey = await assetModel.keyOf(assetId);
    let balance = 0;
    let currentSynced = '';

    await noteModel.each(
        async ({
            key,
            asset,
            owner,
            viewingKey: encryptedVkString,
            status,
        }) => {
            currentSynced = key;
            if (asset !== assetKey
                || owner !== ownerKey
                || isDestroyed(status)
            ) {
                return;
            }

            let value = 0;
            try {
                const realViewingKey = fromHexString(encryptedVkString).decrypt(linkedPrivateKey);
                value = valueFromViewingKey(realViewingKey);
            } catch (error) {
                errorLog('Failed to decrypt note from viewingKey.', {
                    viewingKey: encryptedVkString,
                });
                return;
            }

            if (!noteValues[value]) {
                noteValues[value] = [];
            }
            noteValues[value].push(key);
            balance += value;
        },
        {
            idGt: lastSynced,
        },
    );

    return {
        balance,
        noteValues,
        lastSynced: currentSynced,
    };
}
