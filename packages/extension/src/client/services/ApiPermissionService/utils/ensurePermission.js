import ApiError from '~/client/utils/ApiError';
import ConnectionService from '~/client/services/ConnectionService';

export default async function ensurePermission() {
    const account = await ConnectionService.query('registerExtension');
    if (!account || account.error) {
        throw new ApiError('account.not.registered');
    }

    const domain = await ConnectionService.query('registerDomain');
    if (!domain || domain.error) {
        throw new ApiError('domain.not.registered');
    }

    const {
        address,
        linkedPublicKey,
        spendingPublicKey,
    } = account;

    return {
        account: {
            address,
            linkedPublicKey,
            spendingPublicKey,
        },
        domain,
    };
}
