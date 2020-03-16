import BigInt from 'apollo-type-bigint';
import fetchAsset from './utils/fetchAsset';
import getAssetBalance from './utils/getAssetBalance';
import decryptViewingKey from './utils/decryptViewingKey';
import {
    valueFromViewingKey,
} from '~/utils/note';

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
        decryptedViewingKey: async ({ viewingKey }) => decryptViewingKey(viewingKey),
        value: async ({ viewingKey }) => {
            const decryptedViewingKey = await decryptViewingKey(viewingKey);
            if (!decryptedViewingKey) {
                return 0;
            }
            return valueFromViewingKey(decryptedViewingKey);
        },
    },
    Asset: {
        balance: async ({ address }) => getAssetBalance(address),
    },
    Query: {},
    Mutation: {},
};
