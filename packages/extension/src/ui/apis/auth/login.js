import AuthService from '~background/services/AuthService';

export default async function login({
    address,
    password,
}) {
    try {
        await AuthService.login({
            address,
            password,
        });
    } catch (e) {
        return false;
    }

    return true;
}
