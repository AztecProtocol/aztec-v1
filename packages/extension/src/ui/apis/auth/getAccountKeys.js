import AuthService from '~/background/services/AuthService';

export default async function getAccountKeys() {
    const keyStore = await AuthService.getKeyStore();
    const {
        pwDerivedKey,
    } = await AuthService.getSession();

    return {
        keyStore,
        pwDerivedKey,
    };
}
