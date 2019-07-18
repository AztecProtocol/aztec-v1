import GraphNodeService from '~backgroundServices/GraphNodeService';
import {
    ADDRESS_LENGTH,
} from '~config/constants';
import metadata, {
    toString,
} from '~utils/metadata';
import {
    encryptMessage,
} from '~utils/crypto';
import {
    argsError,
} from '~utils/error';

export default async function requestGrantAccess(args) {
    const {
        noteId,
        address,
    } = args;

    const addressList = [];
    for (let i = 0; i < address.length; i += ADDRESS_LENGTH) {
        addressList.push(address.substr(i, ADDRESS_LENGTH));
    }

    // TODO
    // get currentUser from AuthService
    const currentUser = {
        address: '0x_account_00000000000000000000_address__0',
    };

    const queryStr = `
        query (
            $noteId: ID
            $noteAccessesWhere: NoteAccess_filter
            $accountsWhere: Account_filter
        ) {
            userAccess: noteAccess(noteId: $noteId, account: "${currentUser.address}") {
                note {
                    metadata
                    asset {
                        id
                    }
                }
                viewingKey
            }
            existingAccesses: noteAccesses(first: ${addressList.length}, where: $noteAccessesWhere) {
                account {
                    address
                }
            }
            sharedAccounts: accounts(first: ${addressList.length}, where: $accountsWhere) {
                address
                publicKey
            }
        }
    `;
    const variables = {
        noteId,
        noteAccessesWhere: {
            note: noteId,
            account_in: addressList,
        },
        accountsWhere: {
            address_in: addressList,
        },
    };
    const {
        userAccess,
        existingAccesses,
        sharedAccounts,
    } = await GraphNodeService.query({
        query: queryStr,
        variables,
    });

    if (!userAccess) {
        return argsError('account.noteAccess', {
            noteId,
            account: currentUser.address,
        });
    }

    if (!sharedAccounts
        || sharedAccounts.length !== addressList.length
    ) {
        if (addressList.length === 1) {
            return argsError('account.notFound', {
                account: addressList[0],
            });
        }

        const notFound = addressList
            .filter(addr => !sharedAccounts.find(a => a.address !== addr));
        return argsError('account.notFound.count', {
            count: notFound.length,
            accounts: notFound,
        });
    }

    const invalidAccounts = sharedAccounts.filter(a => !a.publicKey);
    if (invalidAccounts.length === 1) {
        return argsError('account.notFound.publicKey', {
            account: invalidAccounts[0],
        });
    }
    if (invalidAccounts.length > 1) {
        return argsError('account.notFound.publicKeys', {
            count: invalidAccounts.length,
            accounts: invalidAccounts,
        });
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

    if (existingAccesses
        && existingAccesses.length === addressList.length
    ) {
        return {
            prevMetadataStr,
        };
    }

    const {
        addresses,
        viewingKeys,
        aztecData,
    } = metadata(prevMetadataStr);
    const newAddresses = [];
    const newViewingKeys = [];
    addressList.forEach((addr) => {
        if (existingAccesses.some(a => a.account.address === addr)) return;
        const {
            publicKey,
        } = sharedAccounts.find(a => a.address === addr);
        const viewingKey = encryptMessage(publicKey, userViewingKey);
        newAddresses.push(addr);
        newViewingKeys.push(viewingKey);
    });

    const newMetadataStr = toString({
        aztecData,
        addresses: [
            ...addresses,
            ...newAddresses,
        ],
        viewingKeys: [
            ...viewingKeys,
            ...newViewingKeys,
        ],
    });

    return {
        prevMetadataStr,
        metadata: newMetadataStr,
        asset: assetId,
    };
}
