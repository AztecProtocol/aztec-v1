import Account from '~/background/database/models/account';


export default async function createBulkAssets(accounts, networkId) {
    return Account.bulkAdd(accounts, { networkId });
}
