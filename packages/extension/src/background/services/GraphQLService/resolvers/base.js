import BigInt from 'apollo-type-bigint';
import assetModel from '~database/models/asset';
import accountModel from '~database/models/account';
import {
    fromCode,
} from '~utils/noteStatus';
import getUserSpendingPublicKey from './utils/getUserSpendingPublicKey';
import decryptViewingKey from './utils/decryptViewingKey';
import getViewingKeyFromMetadata from './utils/getViewingKeyFromMetadata';
import getDecryptedViewingKeyFromMetadata from './utils/getDecryptedViewingKeyFromMetadata';
import getAssetBalance from './utils/getAssetBalance';

export default {
    BigInt: new BigInt('bigInt'),
    User: {
        spendingPublicKey: async () => getUserSpendingPublicKey(),
    },
    Note: {
        asset: async ({ asset }) => (typeof asset === 'string' && assetModel.get({ key: asset })) || asset,
        owner: async ({ owner }) => (typeof owner === 'string' && accountModel.get({ key: owner })) || owner,
        decryptedViewingKey: async ({ viewingKey, owner }) => decryptViewingKey(viewingKey, owner),
        status: ({ status }) => fromCode(status),
    },
    UtilityNote: {
        asset: async ({ asset }) => (typeof asset === 'string' && assetModel.get({ id: asset })) || asset,
        viewingKey: async ({ metadata }) => getViewingKeyFromMetadata(metadata),
        decryptedViewingKey: async ({ metadata }) => getDecryptedViewingKeyFromMetadata(metadata),
    },
    Asset: {
        balance: async ({ address }) => getAssetBalance(address),
    },
    GrantNoteAccessPermission: {
        asset: ({ asset }) => asset && assetModel.get({ id: asset }),
    },
    Query: {},
    Mutation: {},
};
