import GraphNodeService from '~backgroundServices/GraphNodeService';
import noteModel from '~database/models/note';
import noteAccessModel from '~database/models/noteAccess';
import metadata, {
    toString,
} from '~utils/metadata';
import {
    encryptMessage,
} from '~utils/crypto';

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
            account {
                address
            }
            note {
                metadata
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

    if (!userAccess
        || !sharedAccount
        || !sharedAccount.publicKey
    ) {
        return null;
    }

    const {
        note: {
            metadata: prevMetadataStr,
        },
        account: owner,
        viewingKey: userViewingKey,
    } = userAccess;

    const isOwner = address === owner.address;

    const note = isOwner
        ? await noteModel.get({ id: noteId })
        : await noteAccessModel.get({ id: noteId });

    if (existingAccess) {
        return {
            ...note,
            metadata: prevMetadataStr,
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
        ...note,
        metadata: newMetadataStr,
    };
}
