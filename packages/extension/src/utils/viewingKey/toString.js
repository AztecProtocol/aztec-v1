export default function toString(viewingKey) {
    const {
        ciphertext,
        ephemPublicKey,
        nonce,
    } = viewingKey;

    return [
        ciphertext,
        ephemPublicKey.slice(2),
        nonce.slice(2),
    ].join('');
}
