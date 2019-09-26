import performCreateAccount from './createAccount';
import performCreateBulkAccounts from './createBulkAccounts';

export const createAccount = (account, networkId) => {
    return performCreateAccount(account, networkId);
}

export const createBulkAccounts = (accounts, networkId) => {
    return performCreateBulkAccounts(accounts, networkId);
}
