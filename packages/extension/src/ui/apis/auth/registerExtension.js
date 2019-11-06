import AuthService from '~background/services/AuthService';

export default async function registerExtension({
    keyStore,
    pwDerivedKey,
}) {
    console.log(keyStore, pwDerivedKey);
    return AuthService.registerExtension({
        keyStore,
        pwDerivedKey,
    });
}
