import {
    permissionError,
} from '~utils/error';
import AuthService from '~background/services/AuthService';

const isDaysAgo = (day, numberOfDays) => day < Date.now() - (numberOfDays * 60 * 60 * 24 * 1000);

export default async function validateSession(_, args) {
    const {
        currentAddress,
    } = args;

    const session = await AuthService.getSession();
    const {
        createdAt,
        lastActive,
    } = session || {};

    if (!session
        || isDaysAgo(createdAt, 21)
        || isDaysAgo(lastActive, 7)
    ) {
        if (session) {
            await AuthService.logout();
        }

        return permissionError('account.not.login', {
            messageOptions: { account: currentAddress },
            currentAddress,
        });
    }

    return {
        session,
    };
}
