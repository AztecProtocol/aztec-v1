import {
    KeyStore,
} from '~/utils/keyvault';

export default async function createPwDerivedKey({
    password,
    salt = 'salty',
}) {
    const {
        pwDerivedKey,
    } = await KeyStore.generateDerivedKey({
        password,
        salt,
    });

    return {
        pwDerivedKey,
    };
}
