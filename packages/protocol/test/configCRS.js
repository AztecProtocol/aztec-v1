/**
 * @module configCRS
 *
 * @dev This initialises the CRS, to enable rapid testing of generated CRSs.
 */
const bn128 = require('@aztec/bn128');
const devUtils = require('@aztec/dev-utils');
const BN = require('bn.js');
const { hexToNumberString, padLeft } = require('web3-utils');

/**
 * CRS variables to be set by user when using a different CRS
 */

// @aztec/bn128

const hXHex = '0x00164b60d0fa1eab5d56d9653aed9dc7f7473acbe61df67134c705638441c4b9';
const hYHex = '0x2bb1b9b55ffdcf2d7254dfb9be2cb4e908611b4adeb4b838f0442fce79416cf0';

bn128.H_X = new BN(hexToNumberString(hXHex), 10);
bn128.H_Y = new BN(hexToNumberString(hYHex), 10);

bn128.h = bn128.curve.point(bn128.H_X, bn128.H_Y);
bn128.t2 = [
    '0x0118c4d5b837bcc2bc89b5b398b5974e9f5944073b32078b7e231fec938883b0',
    '0x260e01b251f6f1c7e7ff4e580791dee8ea51d87a358e038b4efe30fac09383c1',
    '0x22febda3c0c0632a56475b4214e5615e11e6dd3f96e6cea2854a87d4dacc5e55',
    '0x04fc6369f7110fe3d25156c1bb9a72859cf2a04641f99ba4ee413c80da6a5fe4',
];
bn128.CRS = [padLeft(`0x${bn128.H_X.toString(16)}`, 64), padLeft(`0x${bn128.H_Y.toString(16)}`, 64), ...bn128.t2];

// @aztec/dev-utils
devUtils.constants.K_MAX_TEST = 16000;
devUtils.constants.SIGNATURES_PER_FILE = 1000;

// this following constant needs updating
devUtils.constants.ZERO_VALUE_NOTE_HASH = '0x26d21f105b054b61e8d9680855c3af0633bd7c140b87de95f0ac218046fc71db';

module.exports = {
    CRS: bn128.CRS,
};

console.log('CRS configured');
