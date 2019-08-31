import createOrUpdateAsset from './createOrUpdateAsset';

export default async function addAsset(createNoteRegistry) {
    return createOrUpdateAsset(createNoteRegistry);
}
