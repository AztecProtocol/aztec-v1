import BigInt from 'apollo-type-bigint';
import fetchAsset from './utils/fetchAsset';
import getViewingKeyFromMetadata from './utils/getViewingKeyFromMetadata';
import getDecryptedViewingKeyFromMetadata from './utils/getDecryptedViewingKeyFromMetadata';
import getAssetBalance from './utils/getAssetBalance';

const getAsset = async (parentAsset) => {
    if (typeof parentAsset !== 'string') {
        return parentAsset;
    }
    const {
        asset,
    } = await fetchAsset({
        address: parentAsset,
    });
    return asset;
};

export default {
    BigInt: new BigInt('bigInt'),
    Note: {
        asset: async ({ asset }) => getAsset(asset),
        owner: async ({ owner }) => (typeof owner === 'string' && ({ address: owner })) || owner,
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
        asset: async ({ asset }) => getAsset(asset),
    },
    Query: {},
    Mutation: {},
};
