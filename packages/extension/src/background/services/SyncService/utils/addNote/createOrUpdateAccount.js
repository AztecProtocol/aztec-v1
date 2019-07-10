import accountModel from '~database/models/account';

export default async function createOrUpdateAccount(account) {
    const {
        key,
        modified,
    } = await accountModel.set(
        account,
        {
            ignoreDuplicate: true,
        },
    );

    if (modified.length === 0) {
        // TODO
        // didn't create a new account
        // update existing data instead
    }

    return {
        ...account,
        key,
    };
}
