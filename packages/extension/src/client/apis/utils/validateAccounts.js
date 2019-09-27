import address from '~utils/address';
import query from '~client/utils/query';
import ApiError from '~client/utils/ApiError';

export default async function validateAccounts(accountAddress = '') {
    const addressInputs = typeof accountAddress === 'string'
        ? [accountAddress]
        : accountAddress;
    const validAddresses = addressInputs.map(addr => address(addr));
    const invalidInputs = validAddresses.filter((addr, i) => !validAddresses[i]);
    if (invalidInputs.length > 0) {
        throw new ApiError('input.address.not.valid', {
            address: invalidInputs,
        });
    }

    const addressArrStr = validAddresses.map(a => `"${a}"`).join(',');
    const {
        accountsResponse,
        error,
    } = await query(`
        accountsResponse: accounts(where: { address_in: [${addressArrStr}] }) {
            accounts {
                address
                linkedPublicKey
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
        accounts = [],
    } = accountsResponse || {};

    const invalidAccounts = validAddresses.filter(addr => !accounts.find(a => a.address === addr));
    if (invalidAccounts.length > 0) {
        throw new ApiError('account.not.linked', {
            address: invalidAccounts,
        });
    }

    return accounts;
}
