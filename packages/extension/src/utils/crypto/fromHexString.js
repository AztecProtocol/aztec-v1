export default function fromHexString(hexString) {
    return new Uint8Array(hexString.substr(2).match(/.{1,2}/g)
        .map(byte => parseInt(byte, 16)));
}
