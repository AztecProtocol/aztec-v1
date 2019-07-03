import assetModel from '~database/models/asset';

export default {
    async createOrUpdate(asset) {
        const {
            id,
        } = asset;

        const {
            data,
            modified,
        } = await assetModel.set(
            {
                id,
                balance: 0,
            },
            {
                ignoreDuplicate: true,
            },
        );

        if (modified.indexOf(id) < 0) {
            // TODO
            // didn't create a new asset
            // update existing data instead
        }

        return {
            ...asset,
            key: data[id],
        };
    },
};
