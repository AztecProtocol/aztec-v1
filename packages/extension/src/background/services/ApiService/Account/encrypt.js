import {
    encryptMessage,
} from '~/utils/crypto';

export default async function encrypt({
    data: {
        args: {
            linkedPublicKey,
            message,
        },
    },
}) {
    const encrypted = encryptMessage(linkedPublicKey, message);
    return {
        message: {
            encrypted: encrypted.toHexString(),
        },
    };
}
