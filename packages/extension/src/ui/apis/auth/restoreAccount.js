import AuthService from '~background/services/AuthService';
import createPwDerivedKey from './createPwDerivedKey';
import createKeyVault from './createKeyVault';

export default async function restoreAccount({
    address,
    seedPhrase,
    password,
}) {
    const {
        pwDerivedKey,
    } = await createPwDerivedKey({
        password,
    });
    const {
        keyStore,
    } = await createKeyVault({
        pwDerivedKey,
        seedPhrase,
    });
    const linkedPublicKey = keyStore.privacyKeys.publicKey;

    await AuthService.registerExtension({
        pwDerivedKey,
        keyStore,
    });

    await AuthService.registerAddress({
        address,
        linkedPublicKey,
    });

    return {
        linkedPublicKey,
    };
}
