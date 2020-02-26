import AuthService from '~/background/services/AuthService';
import Web3Service from '~/helpers/Web3Service';
import {
    fromHexString,
} from '~/utils/crypto';
import decodePrivateKey from '~/background/utils/decodePrivateKey';

export default async function decrypt({
    data: {
        args: {
            address,
            message,
        },
    },
}) {
    const {
        address: currentAddress,
    } = Web3Service.account;
    const keyStore = await AuthService.getKeyStore();
    const {
        pwDerivedKey,
    } = await AuthService.getSession() || {};

    let decrypted = '';
    if (address === currentAddress
        && keyStore
        && pwDerivedKey
    ) {
        try {
            const privateKey = decodePrivateKey(keyStore, pwDerivedKey);
            decrypted = fromHexString(message).decrypt(privateKey);
        } catch (e) {
            decrypted = '';
        }
    }

    return {
        result: {
            decrypted,
        },
    };
}
