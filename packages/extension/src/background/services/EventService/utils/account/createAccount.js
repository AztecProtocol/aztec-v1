import Account from '~/background/database/models/account';


export default async function createAccount(account, networkId) {
    return Account.add(account, { networkId });
}
