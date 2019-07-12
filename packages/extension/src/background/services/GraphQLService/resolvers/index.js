import assetModel from '~database/models/asset';
import accountModel from '~database/models/account';
import noteModel from '~database/models/note';
import enableDomain from './enableDomain';
import requestGrantAccess from './requestGrantAccess';

export default {
    Query: {
        asset: async (_, args) => assetModel.get(args),
        note: async (_, args) => noteModel.get(args),
        requestGrantAccess,
    },
    Note: {
        asset: ({ asset }) => assetModel.get({ key: asset }),
        owner: ({ owner }) => accountModel.get({ key: owner }),
    },
    RequestGrantAccess: {
        asset: ({ asset }) => asset && assetModel.get({ id: asset }),
    },
    Mutation: {
        enableDomain,
    },
};
