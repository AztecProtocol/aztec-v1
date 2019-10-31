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
const hXHex = '0x093a76a96633bd5f0a7177040b349486850d98f3a924986f219cc2366f21e4d1';
const hYHex = '0x13c6ccce9ac58d3a4b6899acdb17e52be9c88208fbb2fad9aeaf60ab14788e3a';

bn128.H_X = new BN(hexToNumberString(hXHex), 10);
bn128.H_Y = new BN(hexToNumberString(hYHex), 10);
bn128.h = bn128.curve.point(bn128.H_X, bn128.H_Y);
bn128.t2 = [
    '0x293ac2bf4d234d8c820c91bbbbbe4aeeefeacd407153bd585d288a96372f3a72',
    '0x2ea4865f019129437c22977d4a460855a30f160d2ea3e224281d1eccd5ce4fa2',
    '0x29fb36fb858e8886286c7901e5ec956efa65c2b20bed2b5493ef5545da8edb98',
    '0x0523def7549176dbefc119c5cc975d4a92cd4bed8ce08ecd301fceecbd6efa7f',
];
bn128.CRS = [padLeft(`0x${bn128.H_X.toString(16)}`, 64), padLeft(`0x${bn128.H_Y.toString(16)}`, 64), ...bn128.t2];

// @aztec/dev-utils
devUtils.constants.K_MAX_TEST = 15000;
devUtils.constants.SIGNATURES_PER_FILE = 1000;
devUtils.constants.ZERO_VALUE_NOTE_HASH = '0x828d004b7cff80b8fc6915f80d7e239d1d265e83781aee56b74041df0f599694';

module.exports = {
    CRS: bn128.CRS,
};

console.log('CRS configured');
