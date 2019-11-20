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

const hXHex = '0x10f7463e3bdb09c66bcc67cbd978bb8a2fd8883782d177aefc6d155391b1d1b8';
const hYHex = '0x12c4f960e11ba5bf0184d3433a98127e90a6fdb2d1f12cdb369a5d3870866627';

bn128.H_X = new BN(hexToNumberString(hXHex), 10);
bn128.H_Y = new BN(hexToNumberString(hYHex), 10);

bn128.h = bn128.curve.point(bn128.H_X, bn128.H_Y);
bn128.t2 = [
    '0x01cf7cc93bfbf7b2c5f04a3bc9cb8b72bbcf2defcabdceb09860c493bdf1588d',
    '0x08d554bf59102bbb961ba81107ec71785ef9ce6638e5332b6c1a58b87447d181',
    '0x204e5d81d86c561f9344ad5f122a625f259996b065b80cbbe74a9ad97b6d7cc2',
    '0x02cb2a424885c9e412b94c40905b359e3043275cd29f5b557f008cd0a3e0c0dc',
];
bn128.CRS = [padLeft(`0x${bn128.H_X.toString(16)}`, 64), padLeft(`0x${bn128.H_Y.toString(16)}`, 64), ...bn128.t2];

// @aztec/dev-utils
devUtils.constants.K_MAX_TEST = 14336;
devUtils.constants.SIGNATURES_PER_FILE = 1024;
devUtils.constants.ZERO_VALUE_NOTE_HASH = '0xcbc417524e52b95c42a4c42d357938497e3d199eb9b4a0139c92551d4000bc3c';

console.log('CRS configured');
