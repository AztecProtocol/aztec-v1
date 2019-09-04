import crypto from 'crypto';

export default function randomId(len = 32, radix = 16) {
    const array = crypto.randomBytes(Math.ceil(len / 4) * 4);

    let str = '';
    for (let i = 0; i < array.length; i += 1) {
        str += array[i].toString(radix).slice(-4);
    }

    return str.slice(0, len);
}
