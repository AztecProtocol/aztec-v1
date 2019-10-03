import UIError from '~ui/helpers/UIError';
import apollo from '~ui/apis/helpers/apollo';

export const getExtensionAccount = async (address) => {
    const {
        account,
    } = await apollo.query(`
        account(address: "${address}") {
            address
            linkedPublicKey
        }
    `);

    if (!account || !account.linkedPublicKey) {
        throw new UIError('account.not.linked', {
            address,
        });
    }

    return account;
};

export const getNoteOwnerAccount = async (address) => {
    const {
        user,
    } = await apollo.query(`
        user(id: "${address}") {
            address
            linkedPublicKey
            spendingPublicKey
        }
    `);

    if (!user || !user.spendingPublicKey) {
        throw new UIError('account.not.linked', {
            address,
        });
    }

    return user;
};
