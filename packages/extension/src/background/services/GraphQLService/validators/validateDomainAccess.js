import {
    permissionError,
} from '~/utils/error';
import noteModel from '~/background/database/models/note';
import assetModel from '~/background/database/models/asset';
import AuthService from '~/background/services/AuthService';
import Web3Service from '~/helpers/Web3Service';

export default async function validateDomainAccess(_, args, ctx, info) {
    const {
        domain,
        currentAddress,
    } = args;
    let {
        assetId,
    } = args;
    const {
        networkId,
    } = Web3Service;
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
        const note = await noteModel.get(
            { networkId },
            noteId,
        );
        if (note) {
            const {
                asset: registryOwner,
            } = note;
            ({
                id: assetId,
            } = await assetModel.get(
                { networkId },
                { registryOwner },
            ));
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
