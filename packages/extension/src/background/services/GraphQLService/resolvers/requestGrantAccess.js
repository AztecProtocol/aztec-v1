import GraphNodeService from '~backgroundServices/GraphNodeService';
import metadata, {
    toString,
} from '~utils/metadata';
import {
    encryptMessage,
} from '~utils/crypto';
import {
    argsError,
} from '~utils/error';

export default async function requestGrantAccess(_, args) {
    const {
        noteId,
        address,
    } = args;

    // TODO
    // get currentUser from AuthService
    const currentUser = {
        address: '0x_account_00000000000000000000_address__0',
    };

    const {
        userAccess,
        existingAccess,
        sharedAccount,
    } = await GraphNodeService.query(`
        userAccess: noteAccess(noteId: "${noteId}", account: "${currentUser.address}") {
            note {
                metadata
                asset {
                    id
                }
            }
            viewingKey
        }
        existingAccess: noteAccess(noteId: "${noteId}", account: "${address}") {
            id
        }
        sharedAccount: account(id: "${address}") {
            publicKey
        }
    `);

    let error;
    if (!userAccess) {
        error = argsError('account.noteAccess', {
            noteId,
            account: currentUser.address,
        });
    } else if (!sharedAccount) {
        error = argsError('account.notFound', args);
    } else if (!sharedAccount.publicKey) {
        error = argsError('account.notFound.publicKey', args);
    }

    if (error) {
        return {
            error,
        };
    }

    const {
        note: {
            metadata: prevMetadataStr,
            asset: {
                id: assetId,
            },
        },
        viewingKey: userViewingKey,
    } = userAccess;

    if (existingAccess) {
        return {
            prevMetadataStr,
        };
    }

    const {
        publicKey,
    } = sharedAccount;
    const {
        addresses,
        viewingKeys,
        aztecData,
    } = metadata(prevMetadataStr);
    const viewingKey = encryptMessage(publicKey, userViewingKey);

    const newMetadataStr = toString({
        aztecData,
        addresses: [
            ...addresses,
            address,
        ],
        viewingKeys: [
            ...viewingKeys,
            viewingKey,
        ],
    });

    return {
        prevMetadataStr,
        metadata: newMetadataStr,
        asset: assetId,
    };
}
