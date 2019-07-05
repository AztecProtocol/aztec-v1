import assetStorage from './assetStorage';
import noteStorage from './noteStorage';

export default {
    addNote: async (note) => {
        const {
            asset,
        } = note;

        const {
            key: assetKey,
        } = await assetStorage.createOrUpdate(asset);

        const noteData = {
            ...note,
            assetKey,
        };
        await noteStorage.createOrUpdate(noteData);
    },
};
