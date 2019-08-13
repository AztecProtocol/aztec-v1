import address from '~utils/address';
import query from '~client/utils/query';
import ApiError from '~client/utils/ApiError';

export default async function validateExtensionAccount(accountAddress) {
    const validAddress = address(accountAddress);
    if (accountAddress && !validAddress) {
        throw new ApiError('input.address.not.valid', {
            address: accountAddress,
        });
    }

    const {
        user,
    } = await query(`
        user(id: "${validAddress}") {
            account {
                address
                linkedPublicKey
                spendingPublicKey
            }
            error {
                type
                key
                message
                response
            }
        }
    `);

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
