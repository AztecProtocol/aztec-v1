import address from '~utils/address';
import ApiError from '~client/utils/ApiError';
import UserQuery from '../../../queries/UserQuery';
import apollo from '../../../../background/services/GraphQLService';

export default async function validateExtensionAccount({
    accountAddress,
    domain,
    currentAddress,
}) {
    const validAddress = address(accountAddress);
    if (accountAddress && !validAddress) {
        throw new ApiError('input.address.not.valid', {
            address: accountAddress,
        });
    }
    console.log({
        accountAddress,
        domain,
        currentAddress,
    });

    const {
        data: {
            user,
        },
    } = await apollo.query({
        query: UserQuery,
        variables: {
            id: validAddress,
            domain,
            currentAddress: address(currentAddress),
        },
    });

    console.log(user);

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
