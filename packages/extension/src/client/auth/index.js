import validateUserPermission from './validateUserPermission';
import sendRegisterExtensionTx from './sendRegisterExtensionTx';
import ApiError from '~client/utils/ApiError';

export default async function ensureExtensionInstalled() {
    const {
        account,
        error,
    } = await validateUserPermission();

    if (!account || error) {
        throw new ApiError('account.not.registered', {
            error,
        });
    }

    if (account && account.registeredAt) {
        return account;
    }

    return sendRegisterExtensionTx(account);
}
