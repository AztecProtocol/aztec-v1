import address from '~utils/address';
import { handleQuery } from '../../../utils/connectionUtils';
import {
    dataError,
} from '~utils/error';

export default async function validateExtensionAccount(accountAddress) {
    const validAddress = address(accountAddress);
    if (accountAddress && !validAddress) {
        throw dataError('input.address.notValid', {
            address: accountAddress,
        });
    }

    const {
        response,
    } = await handleQuery({
        query: `
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
    `,
    });

    const {
        account,
    } = response || {};

    if (!account) {
        throw dataError('account.not.linked', {
            addresses: accountAddress,
        });
    }

    return response;
}
