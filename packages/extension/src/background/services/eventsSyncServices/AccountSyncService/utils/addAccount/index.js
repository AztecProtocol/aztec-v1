import createOrUpdateAccount from './createOrUpdateAccount';

export default async function addAccount(account) {
    return createOrUpdateAccount(account);
}
