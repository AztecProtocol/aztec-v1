import AuthService from '~backgroundServices/AuthService';
import noteModel from '~database/models/note';
import assetModel from '~database/models/asset';

export default async function validateDomainAccess(_, args, ctx, info) {
    let { assetId } = args;
    let noteId;
    const entityType = info.fieldName;
    switch (entityType) {
        case 'asset':
            assetId = args.id;
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
        if (note) {
            const {
                asset: assetKey,
            } = note;
            ({
                id: assetId,
            } = await assetModel.get({
                key: assetKey,
            }));
        }
    }

    if (!assetId) {
        return null;
    }

    return AuthService.validateDomainAccess({
        assetId,
        noteId,
        domain: args.domain,
        currentAddress: args.currentAddress,
    });
}
