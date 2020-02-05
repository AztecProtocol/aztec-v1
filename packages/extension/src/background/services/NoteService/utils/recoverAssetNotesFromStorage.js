import {
    get,
} from '~/utils/storage';
import dataKey from '~/utils/dataKey';
import {
    batchDecrypt,
    fromHexString,
} from '~/utils/crypto';
import parseNoteValuesStrings from './parseNoteValuesStrings';

export default async function recoverAssetNotesFromStorage(
    version,
    networkId,
    owner,
    assetId,
) {
    const {
        address,
        linkedPrivateKey,
    } = owner;
    const assetNotes = await get(dataKey('userAssetNotes', {
        version,
        network: networkId,
        user: address,
        asset: assetId,
    })) || [];

    const encryptedData = assetNotes.map(fromHexString);
    const noteValuesArr = batchDecrypt(linkedPrivateKey, encryptedData);

    return parseNoteValuesStrings(noteValuesArr);
}
