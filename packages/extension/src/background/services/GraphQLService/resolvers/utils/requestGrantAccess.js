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
import Web3Service from '~/helpers/Web3Service';
import EventService from '~background/services/EventService';

const packExistingAccesses = usersAddresses => usersAddresses.map(rawAddress => ({
    account: {
        address: rawAddress,
    },
}));

const packUserAccess = (viewingKey, note) => ({
    userAccess: {
        note: {
            metadata: note.metadata,
            asset: {
                id: note.asset,
            },
        },
        viewingKey,
    },
});

const packSharedAccounts = accounts => accounts.map(account => ({
    sharedAccounts: {
        address: account.address,
        publicKey: account.linkedPublicKey,
    },
}));

export default async function requestGrantAccess(args, ctx) {
    const {
        noteId,
        address,
    } = args;
    const {
        address: userAddress,
        // TODO: remove default value, when it will be passed here.
    } = ctx;
    const { networkId } = Web3Service;
    const addressList = [];
    for (let i = 0; i < address.length; i += ADDRESS_LENGTH) {
        addressList.push(address.substr(i, ADDRESS_LENGTH));
    }
    const addressListPromises = addressList.map(rawAddress => EventService.fetchAztecAccount({
        address: rawAddress,
        networkId,
    }));
    const sharedAccountsRaw = await Promise.all(addressListPromises);
    const sharedAccounts = packSharedAccounts(sharedAccountsRaw.map(({ account }) => account));
    const {
        note,
    } = await EventService.fetchLatestNote({
        noteHash: noteId,
        networkId,
    });
    const {
        viewingKey,
    } = metadata(note.metadata).getAccess(userAddress);
    const userAccess = packUserAccess(viewingKey, note);
    const existingAccesses = packExistingAccesses(addressList);
    if (!userAccess || !userAccess.length) {
        throw argsError('account.noteAccess', {
            messageOptions: {
                noteId,
                account: userAddress,
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
            .filter(addr => !sharedAccounts.find(a => a.address === addr));
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
        newViewingKeys.push(viewingKey.toString());
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
