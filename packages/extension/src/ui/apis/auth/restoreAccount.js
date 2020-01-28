import AuthService from '~/background/services/AuthService';
import createPwDerivedKey from './createPwDerivedKey';
import createKeyStore from './createKeyStore';
import clearDB from '~/background/database/utils/clearDB';

export default async function restoreAccount({
    address,
    seedPhrase,
    password,
}) {
    clearDB({
        clearAllNetworks: true,
    });
    const {
        pwDerivedKey,
    } = await createPwDerivedKey({
        password,
    });
    const {
        keyStore,
    } = await createKeyStore({
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
