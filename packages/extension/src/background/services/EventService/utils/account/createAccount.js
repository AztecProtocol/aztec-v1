import Account from '~background/database/models/account';


export default async function createAccount(account) {
    return Account.add(account);
}