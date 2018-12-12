const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const utils = {};

utils.bnToHex = function bnToHex(bignum) {
    if (!BN.isBN(bignum)) {
        throw new Error(`expected ${bignum} to be of type BN`);
    }
    return `0x${padLeft(bignum.toString(16), 64)}`;
};

module.exports = utils;
