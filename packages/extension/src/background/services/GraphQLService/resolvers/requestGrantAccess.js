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

export default async function requestGrantAccess(args, ctx) {
    const {
        noteId,
        address,
    } = args;
    const {
        user: currentUser,
    } = ctx;

    const addressList = [];
    for (let i = 0; i < address.length; i += ADDRESS_LENGTH) {
        addressList.push(address.substr(i, ADDRESS_LENGTH));
    }

    const queryStr = `
        query (
            $userAccessesWhere: NoteAccess_filter
            $noteAccessesWhere: NoteAccess_filter
            $accountsWhere: Account_filter
        ) {
            userAccess: noteAccesses(first: 1, where: $userAccessesWhere) {
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
        userAccessesWhere: {
            account: currentUser.address,
        },
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
    }) || {};

    if (!userAccess || !userAccess.length) {
        throw argsError('account.noteAccess', {
            messageOptions: {
                noteId,
                account: currentUser.address,
            },
        });
    }

    if (!sharedAccounts
        || sharedAccounts.length !== addressList.length
    ) {
        if (addressList.length === 1) {
            throw argsError('account.notFound', {
                messageOptions: {
                    account: addressList[0],
                },
                invalidAccounts: addressList,
            });
        }

        const notFound = addressList
            .filter(addr => !sharedAccounts.find(a => a.address !== addr));
        throw argsError('account.notFound.count', {
            messageOptions: {
                count: notFound.length,
                accounts: notFound,
            },
            invalidAccounts: notFound,
        });
    }

    const invalidAccounts = sharedAccounts.filter(a => !a.publicKey);
    if (invalidAccounts.length === 1) {
        throw argsError('account.notFound.publicKey', {
            messageOptions: {
                account: invalidAccounts[0],
            },
            invalidAccounts,
        });
    }
    if (invalidAccounts.length > 1) {
        throw argsError('account.notFound.publicKeys', {
            messageOptions: {
                count: invalidAccounts.length,
                accounts: invalidAccounts,
            },
            invalidAccounts,
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
    } = userAccess[0];

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
