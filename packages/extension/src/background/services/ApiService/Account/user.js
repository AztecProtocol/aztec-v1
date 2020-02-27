import EthCrypto from 'eth-crypto';
import userQuery from '~/background/services/GraphQLService/Queries/userQuery';
import query from '../utils/query';

export default async (request) => {
    const data = await query(request, userQuery(`
        address
        linkedPublicKey
        spendingPublicKey
    `));
    const {
        user,
    } = data || {};
    const {
        account,
        error,
    } = user || {};

    if (error || !account) {
        return data;
    }

    const {
        spendingPublicKey,
    } = account;
    const compressedPublicKey = `0x${EthCrypto.publicKey.compress(spendingPublicKey.slice(2))}`;

    // TODO - change all spendingPublicKey in the sdk to be compressedPublicKey
    return {
        user: {
            ...user,
            account: {
                ...account,
                spendingPublicKey: compressedPublicKey,
                publicKey: spendingPublicKey,
            },
        },
    };
};
