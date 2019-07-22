import AuthService from '~backgroundServices/AuthService';
import noteModel from '~database/models/note';
import assetModel from '~database/models/asset';

export default async function validateDomainAccess(_, args, ctx, info) {
    let { asset } = args;
    let noteId;
    const entityType = info.fieldName;
    switch (entityType) {
    case 'asset':
        asset = args.id;
        break;
    case 'note':
        noteId = args.id;
        break;
    case 'grantNoteAccessPermission':
        ({ noteId } = args);
        break;
    default:
    }

    if (noteId) {
        const note = await noteModel.get({
            id: noteId,
        });
        if (!note) {
            return null;
        }

        const {
            asset: assetKey,
        } = note;
        ({
            id: asset,
        } = await assetModel.get({
            key: assetKey,
        }));
    }

    return AuthService.validateDomainAccess({
        asset,
        domain: args.domain,
    });
}
