export default function toHexString(encryptedData) {
    const {
        ciphertext,
        ephemPublicKey,
        nonce,
    } = encryptedData;

    return [
        ciphertext,
        ephemPublicKey.slice(2),
        nonce.slice(2),
    ].join('');
}
