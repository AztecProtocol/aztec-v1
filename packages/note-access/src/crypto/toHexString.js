export default function toHexString(byteArray) {
    let s = '0x';
    byteArray.forEach((byte) => {
        s += `0${(byte & 0xff).toString(16)}`.slice(-2); // eslint-disable-line no-bitwise
    });
    return s;
}
