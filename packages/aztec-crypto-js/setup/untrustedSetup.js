const BN = require('bn.js');
const crypto = require('crypto');
const bn128 = require('../bn128/bn128');

const untrustedSetup = {};

untrustedSetup.createSignature = (inputValue) => {
    // Create a random, fake setup key.
    // y = trusted setup key
    // h = generator point, supplied by the bn128 library
    const y = new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
    const v = y.redSub(new BN(inputValue).toRed(bn128.groupReduction)).redInvm();
    const signature = bn128.h.mul(v);

    return signature;
};

module.exports = untrustedSetup;
