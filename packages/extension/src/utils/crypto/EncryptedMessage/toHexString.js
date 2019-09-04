export default function toHexString(encryptedData) {
    const {
        ciphertext,
        ephemPublicKey,
        nonce,
    } = encryptedData;

    return [
        nonce,
        ephemPublicKey.slice(2),
        ciphertext.slice(2),
    ].join('');
}
