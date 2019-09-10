import performCreateAccount from './createAccount';
import performCreateBulkAccounts from './createBulkAccounts';

export const createAccount = (account) => {
    return performCreateAccount(account);
}

export const createBulkAccounts = (accounts) => {
    return performCreateBulkAccounts(accounts);
}
