import {
    note as noteUtils,
} from 'aztec.js';
import EthCrypto from 'eth-crypto';

export default async function createNote(value, publicKey, owner, access) {
    let accessArr;
    if (access) {
        accessArr = access;
        if (typeof access === 'string') {
            accessArr = [
                {
                    address: owner,
                    linkedPublicKey: access,
                },
            ];
        } else if (!Array.isArray(access)) {
            accessArr = [access];
        }
    }

    const compressedPublicKey = publicKey.length === 68
        ? publicKey
        : `0x${EthCrypto.publicKey.compress(publicKey.slice(2))}`;

    return noteUtils.create(compressedPublicKey, value, accessArr, owner);
}
