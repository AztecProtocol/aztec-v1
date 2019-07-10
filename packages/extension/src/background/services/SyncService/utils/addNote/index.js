import createOrUpdateAccount from './createOrUpdateAccount';
import createOrUpdateAsset from './createOrUpdateAsset';
import createOrUpdateNote from './createOrUpdateNote';

export default async function addNote(note) {
    const {
        asset,
        owner,
    } = note;

    const [
        {
            key: assetKey,
        },
        {
            key: ownerKey,
        },
    ] = await Promise.all([
        createOrUpdateAsset(asset),
        createOrUpdateAccount(owner),
    ]);

    const noteData = {
        ...note,
        assetKey,
        ownerKey,
    };
    await createOrUpdateNote(noteData);
}
