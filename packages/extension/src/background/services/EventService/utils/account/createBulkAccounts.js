import Account from '~background/database/models/account';


export default async function createBulkAssets(accounts) {
    return Account.bulkAdd(accounts);
}