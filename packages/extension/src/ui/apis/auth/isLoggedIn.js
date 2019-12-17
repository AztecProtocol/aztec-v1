import AuthService from '~/background/services/AuthService';
import ensureAccount from '~/background/services/GraphQLService/decorators/ensureAccount';

export default async function isLoggedIn() {
    try {
        const {
            address: currentAddress,
        } = await AuthService.getCurrentUser() || {};
        if (!currentAddress) {
            return false;
        }

        const {
            error,
        } = await ensureAccount(() => {})(null, { currentAddress }) || {};

        return !error;
    } catch (error) {
        return false;
    }
}
