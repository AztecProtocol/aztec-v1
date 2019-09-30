import {
    warnLog,
} from '~utils/log';
import query from '~client/utils/query';
import ApiError from '~client/utils/ApiError';

const validateUser = async (accountAddress) => {
    warnLog(`validateAccount(address, isUser) is deprecated. Use 'validateExtensionAccount(${accountAddress})' instead.`);
    const validAddress = accountAddress;
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
};

export default async function validateAccount(accountAddress = '', isUser = false) {
    if (isUser && typeof accountAddress === 'string') {
        return validateUser(accountAddress);
    }

    warnLog("validateAccount(address, isUser) is deprecated. Use 'validateAccounts(address | [address])' instead.");
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
