import BigInt from 'apollo-type-bigint';
import assetModel from '~database/models/asset';
import accountModel from '~database/models/account';
import getUserSpendingPublicKey from './utils/getUserSpendingPublicKey';
import getViewingKeyFromMetadata from './utils/getViewingKeyFromMetadata';
import getDecryptedViewingKeyFromMetadata from './utils/getDecryptedViewingKeyFromMetadata';
import getAssetBalance from './utils/getAssetBalance';

export default {
    BigInt: new BigInt('bigInt'),
    User: {
        spendingPublicKey: async () => getUserSpendingPublicKey(),
    },
    Note: {
        asset: async ({ asset }) => (typeof asset === 'string' && assetModel.get({ id: asset })) || asset,
        owner: async ({ owner }) => (typeof owner === 'string' && accountModel.get({ key: owner })) || owner,
        viewingKey: async ({ metadata }) => getViewingKeyFromMetadata(metadata),
        decryptedViewingKey: async ({ metadata, owner }) => getDecryptedViewingKeyFromMetadata(
            metadata,
            owner,
        ),
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
