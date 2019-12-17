import {
    argsError,
} from '~/utils/error';
import query from './query';

export default async function validateExtensionAccount(accountAddress) {
    const request = {
        domain: window.location.origin,
    };
    const {
        user: {
            account,
        },
    } = await query(request, `
        user(id: "${accountAddress}") {
            account {
                linkedPublicKey
                spendingPublicKey
            }
        }
    `);

    if (!account
        || !account.linkedPublicKey
        || !account.spendingPublicKey
    ) {
        return argsError('account.not.linked', {
            addresses: [accountAddress],
        });
    }

    return null;
}
