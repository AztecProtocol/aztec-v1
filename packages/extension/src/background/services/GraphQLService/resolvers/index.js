import assetModel from '~database/models/asset';
import accountModel from '~database/models/account';
import noteModel from '~database/models/note';
import requestGrantAccess from './requestGrantAccess';

import AuthService from '../../AuthService';

const pipe = funcs => async (_, args, ctx = {}, info) => {
    let result;
    for (let i = 0; i < funcs.length; i++) {
        result = await funcs[i](_, args, { ...ctx, ...result }, info); // eslint-disable-line no-await-in-loop
    }
    return result;
};


const sessionDecorator = async (_, args, ctx, info) => AuthService.validateSession();

const assetAccessDecorator = async (_, args, ctx, info) => {
    const validation = {};
    switch (info.fieldName.toUpperCase()) {
    case 'ASSET': {
        validation.asset = args.id;
        validation.domain = args.domain;
        break;
    }
    case 'NOTE': {
        // we need to fetch the note to get the asset
        const note = await noteModel.get({
            id: args.id,
        });

        validation.asset = note.asset;
        validation.domain = args.domain;
        break;
    }

    default: {
        break;
    }
    }

    return AuthService.validateDomainAccess({
        asset: args.id,
        domain: args.domain,
    });
};

export default {
    Query: {
        asset: pipe([sessionDecorator, assetAccessDecorator, async (_, args) => assetModel.get(args)]),
        note: pipe([sessionDecorator, assetAccessDecorator, async (_, args) => noteModel.get(args)]),
        requestGrantAccess: pipe([sessionDecorator, assetAccessDecorator, async (_, args) => requestGrantAccess(args)]),
    },
    Note: {
        asset: ({ asset }) => assetModel.get({ id: asset }),
        owner: ({ owner }) => accountModel.get({ id: owner }),
    },
    RequestGrantAccess: {
        asset: ({ asset }) => asset && assetModel.get({ id: asset }),
    },
    Mutation: {
        enableAssetForDomain: pipe([sessionDecorator, async (_, args) => AuthService.enableAssetForDomain(args)]),
        login: AuthService.login,
        // logout: sessionDecorator(AuthService.logout),
        registerExtension: AuthService.registerExtension,
    },
};
