const BN = require('bn.js');

const utils = {};

utils.formatEvenBytes = (bytes) => {
    if (Math.floor(bytes.length / 2) * 2 !== bytes.length) {
        return `0${bytes}`;
    }
    return bytes;
};

utils.toHex = (integer) => {
    return new BN(integer, 10).toString(16);
};

utils.padNBytes = (hex, numBytes) => {
    if (hex.length > numBytes * 2) {
        throw new Error(`value ${hex} has more than ${numBytes} bytes!`);
    }
    let result = hex;
    while (result.length < numBytes * 2) {
        result = `0${result}`;
    }
    return result;
};

utils.normalize = (number) => {
    const max = new BN(2).pow(new BN(256));
    if (number.lt(new BN(0))) {
        return number.umod(max);
    }
    if (number.gt(max.sub(new BN(1)))) {
        return number.umod(max);
    }
    return number;
};

module.exports = utils;
