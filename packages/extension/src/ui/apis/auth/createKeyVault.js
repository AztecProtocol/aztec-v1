import AuthService from '~background/services/AuthService';

export default async function createKeyVault({
    seedPhrase,
    address,
    password,
    salt = 'salty',
}) {
    return AuthService.registerExtension({
        seedPhrase,
        address,
        password,
        salt,
    });
}
