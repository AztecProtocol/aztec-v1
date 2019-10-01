import ApiError from '~client/utils/ApiError';
import UserQuery from '../../../queries/UserQuery';
import apollo from '../../../../background/services/GraphQLService';

export default async function validateExtensionAccount({
    accountAddress,
    domain,
    currentAddress,
}) {
    const validAddress = accountAddress;
    if (accountAddress && !validAddress) {
        throw new ApiError('input.address.not.valid', {
            address: accountAddress,
        });
    }

    const {
        data: {
            user,
        },
    } = await apollo.query({
        query: UserQuery,
        variables: {
            id: validAddress,
            domain,
            currentAddress,
        },
    });


    const {
        account,
    } = user || {};

    if (!account) {
        throw new ApiError('account.not.linked', {
            addresses: accountAddress,
        });
    }

    return account;
}
