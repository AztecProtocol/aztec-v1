import {
    note as noteUtils,
} from 'aztec.js';

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

    return noteUtils.create(publicKey, value, accessArr, owner);
}
