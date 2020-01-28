import noteModel from '~/database/models/note';
import assetModel from '~/database/models/asset';
import {
    permissionError,
} from '~/utils/error';
import AuthService from '~/background/services/AuthService';

export default async function validateDomainAccess(_, args, ctx, info) {
    const {
        domain,
        currentAddress,
    } = args;
    let {
        assetId,
    } = args;
    let noteId;

    const entityType = info.fieldName;
    switch (entityType) {
        case 'asset':
            assetId = args.id;
            break;
        case 'note':
            noteId = args.id;
            break;
        case 'subscribe':
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

    const assets = await AuthService.getDomainApprovedAssets(domain);
    const isApproved = !!assets[assetId];

    if (!isApproved) {
        if (noteId) {
            return permissionError('domain.not.grantedAccess.note', {
                messageOptions: {
                    domain,
                    note: noteId,
                    asset: assetId,
                },
                domain,
                note: noteId,
                asset: assetId,
                currentAddress,
            });
        }
        return permissionError('domain.not.grantedAccess.asset', {
            messageOptions: {
                domain,
                asset: assetId,
            },
            domain,
            asset: assetId,
            currentAddress,
        });
    }

    return {};
}
