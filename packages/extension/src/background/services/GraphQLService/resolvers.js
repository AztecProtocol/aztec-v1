import assetModel from '~database/models/asset';

export default {
    Query: {
        asset: async (_, args) => assetModel.get(args),
    },
};
