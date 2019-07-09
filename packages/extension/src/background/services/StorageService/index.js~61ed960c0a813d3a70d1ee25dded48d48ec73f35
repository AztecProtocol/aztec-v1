import assetStorage from './assetStorage';
import accountStorage from './accountStorage';
import noteStorage from './noteStorage';

export default {
    addNote: async (note) => {
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
            assetStorage.createOrUpdate(asset),
            accountStorage.createOrUpdate(owner),
        ]);

        const noteData = {
            ...note,
            assetKey,
            ownerKey,
        };
        await noteStorage.createOrUpdate(noteData);
    },
};
