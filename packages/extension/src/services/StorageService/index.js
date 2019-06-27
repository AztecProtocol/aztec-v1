import assetStorage from './assetStorage';
import noteStorage from './noteStorage';

export default {
    addNote: async (note) => {
        const {
            id,
            hash,
            asset,
        } = note;

        const {
            key: assetKey,
        } = await assetStorage.createOrUpdate(asset);

        const noteData = {
            id,
            hash,
            assetKey,
        };
        await noteStorage.createOrUpdate(noteData);
    },
};
