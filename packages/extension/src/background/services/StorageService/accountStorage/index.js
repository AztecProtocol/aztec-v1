import accountModel from '~database/models/account';

export default {
    async createOrUpdate(account) {
        const {
            data,
            modified,
        } = await accountModel.set(
            account,
            {
                ignoreDuplicate: true,
            },
        );

        const {
            id,
        } = account;
        if (modified.indexOf(id) < 0) {
            // TODO
            // didn't create a new account
            // update existing data instead
        }

        return {
            ...account,
            key: data[id],
        };
    },
};
