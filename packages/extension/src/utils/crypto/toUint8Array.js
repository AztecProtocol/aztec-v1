export default function toUint8Array(hexString) {
    const typedArr = (hexString.substr(2).match(/.{1,2}/g) || [])
        .map(byte => parseInt(byte, 16));
    return new Uint8Array(typedArr);
}
