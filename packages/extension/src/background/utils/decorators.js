import noteModel from '~/database/models/note';
import AuthService from '../services/AuthService';

export const sessionDecorator = async () => AuthService.validateSession();

export const accountDecorator = async () => AuthService.requiresRegistration();

export const assetAccessDecorator = async (_, args, ctx, info) => {
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
