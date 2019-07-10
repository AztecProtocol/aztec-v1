import assetModel from '~database/models/asset';

export default {
    async createOrUpdate(asset) {
        const {
            key,
            modified,
        } = await assetModel.set(
            {
                ...asset,
                balance: 0,
            },
            {
                ignoreDuplicate: true,
            },
        );

        if (modified.length === 0) {
            // TODO
            // didn't create a new asset
            // update existing data instead
        }

        return {
            ...asset,
            key,
        };
    },
};
