import getShortAddressKey from './getShortAddressKey';
import createOrUpdateAsset from './createOrUpdateAsset';
import createOrUpdateNote from './createOrUpdateNote';

export default async function addNote(note) {
    const {
        asset,
        owner,
    } = note;

    const [
        ownerKey,
        {
            key: assetKey,
        },
    ] = await Promise.all([
        getShortAddressKey(owner.address),
        createOrUpdateAsset(asset),
    ]);

    const noteData = {
        ...note,
        assetKey,
        ownerKey,
    };
    await createOrUpdateNote(noteData);
}
