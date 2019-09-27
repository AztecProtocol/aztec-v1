import performCreateAccount from './createAccount';
import performCreateBulkAccounts from './createBulkAccounts';

export const createAccount = (account, networkId) => performCreateAccount(account, networkId);

export const createBulkAccounts = (accounts, networkId) => performCreateBulkAccounts(accounts, networkId);
