import AuthService from '~/background/services/AuthService';

export default async function registerExtension({
    keyStore,
    pwDerivedKey,
}) {
    return AuthService.registerExtension({
        keyStore,
        pwDerivedKey,
    });
}
