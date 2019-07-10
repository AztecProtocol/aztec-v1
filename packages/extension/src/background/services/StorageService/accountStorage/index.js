import accountModel from '~database/models/account';

export default {
    async createOrUpdate(account) {
        const {
            key,
            modified,
        } = await accountModel.set(
            account,
            {
                ignoreDuplicate: true,
            },
        );

        const {
            address: id,
        } = account;
        if (modified.indexOf(id) < 0) {
            // TODO
            // didn't create a new account
            // update existing data instead
        }

        return {
            ...account,
            key,
        };
    },
};
