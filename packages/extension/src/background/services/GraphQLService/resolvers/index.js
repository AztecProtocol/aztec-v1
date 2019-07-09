import assetModel from '~database/models/asset';
import accountModel from '~database/models/account';
import noteModel from '~database/models/note';
import enableDomain from './enableDomain';

export default {
    Query: {
        asset: async (_, args) => assetModel.get(args),
        note: async (_, args) => noteModel.get(args),
    },
    Note: {
        asset: ({ asset }) => assetModel.get({ id: asset }),
        owner: ({ owner }) => accountModel.get({ id: owner }),
    },
    Mutation: {
        enableDomain,
    },
};
