import AuthService from '~background/services/AuthService';
import decodeKeyStore from '~background/utils/decodeKeyStore';
import decodePrivateKey from '~background/utils/decodePrivateKey';
import decodeLinkedPublicKey from '~background/utils/decodeLinkedPublicKey';
import decodeSpendingPublicKey from '~background/utils/decodeSpendingPublicKey';

import {
    KeyStore,
} from '~utils/keyvault';


export default async function senderAccount(sender) {
    const {
        address,
    } = sender;

    const keyStorePayload = {
        password: '5d4hl6xv5r',
        salt: 'y29qm2',
        seedPhrase: 'topple actress bread print concert trash print kidney gadget retreat text sunny',
        hdPathString: "m/44'/60'/0'/0",
    };

    const { pwDerivedKey } = await KeyStore.generateDerivedKey({
        password: keyStorePayload.password,
        salt: keyStorePayload.salt,
    });

    const keyStore = new KeyStore({
        pwDerivedKey,
        salt: keyStorePayload.salt,
        mnemonic: keyStorePayload.seedPhrase,
        hdPathString: keyStorePayload.hdPathString,
    });

    await AuthService.registerExtension({
        keyStore,
        pwDerivedKey,
    });

    const decodedKeyStore = decodeKeyStore(keyStore, pwDerivedKey);
    const privateKey = decodePrivateKey(decodedKeyStore, pwDerivedKey);
    const linkedPublicKey = decodeLinkedPublicKey(keyStore, pwDerivedKey);
    const spendingPublicKey = decodeSpendingPublicKey(keyStore, pwDerivedKey);
    const account = {
        address,
        linkedPublicKey,
        spendingPublicKey,
        privateKey,
        blockNumber: 1,
    };

    await AuthService.registerAddress(account);

    return account;
}
