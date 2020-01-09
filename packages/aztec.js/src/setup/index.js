/**
 * Read in points from the trusted setup points database.
 * NOTICE: THE TRUSTED SETUP IN THIS REPOSITORY WAS CREATED BY AZTEC ON A SINGLE DEVICE AND
 *   IS FOR TESTING AND DEVELOPMENT PURPOSES ONLY.
 *   We will be launching our multiparty computation trusted setup protocol shortly, where multiple entities
 *   create the trusted setup database and only one of them must act honestly in order for the setup database to be secure.
 *   If you wish to participate please let us know at hello@aztecprotocol.com
 *
 * @module setup
 */

import * as bn128 from '@aztec/bn128';

import { constants } from '@aztec/dev-utils';
import BN from 'bn.js';
import fetch from 'cross-fetch';

const POINTS_DB_URL = 'https://ds8m7zxw3jpbz.cloudfront.net/data';

const setup = {
    POINTS_DB_URL: 'https://ds8m7zxw3jpbz.cloudfront.net/data',
};

/**
 * Decompress a 256-bit representation of a bn128 G1 element.
 *   The first 254 bits define the x-coordinate. The most significant bit defines whether the
 *   y-coordinate is odd
 *
 * @method decompress
 * @param {BN} compressed 256-bit compressed coordinate in BN form
 * @returns {Object.<BN, BN>} x and y coordinates of point, in BN form
 */
setup.decompress = (compressed) => {
    const yBit = compressed.testn(255);
    const x = compressed.maskn(255).toRed(bn128.curve.red);
    const y2 = x
        .redSqr()
        .redMul(x)
        .redIAdd(bn128.curve.b);
    const yRoot = y2.redSqrt();
    if (
        yRoot
            .redSqr()
            .redSub(y2)
            .fromRed()
            .cmpn(0) !== 0
    ) {
        throw new Error('x^3 + 3 not a square, malformed input');
    }
    let y = yRoot.fromRed();
    if (Boolean(y.isOdd()) !== Boolean(yBit)) {
        y = bn128.curve.p.sub(y);
    }
    return { x: x.fromRed(), y };
};

/**
 * Compress a bn128 point into 256 bits.
 *
 * @method compress
 * @param {BN} x x coordinate
 * @param {BN} y y coordinate
 * @returns {BN} 256-bit compressed coordinate, in BN form
 */
setup.compress = (x, y) => {
    let compressed = x;
    if (y.testn(0)) {
        compressed = compressed.or(bn128.compressionMask);
    }
    return compressed;
};

/**
 * Loads a trusted setup signature point h^{\frac{1}{y - k}}, y = setup key, k = input value
 *
 * @method fetchPoint
 * @param {number} inputValue the integer whose negation was signed by the trusted setup key
 * @returns {Object.<BN, BN>} x and y coordinates of signature point, in BN form
 */
setup.fetchPoint = async (inputValue) => {
    const value = Number(inputValue);
    const fileNum = Math.ceil(Number(value + 1) / constants.SIGNATURES_PER_FILE);

    try {
        const res = await fetch(`${setup.POINTS_DB_URL}${fileNum * constants.SIGNATURES_PER_FILE - 1}.dat`);
        if (res.status === 404) {
            throw new Error('point not found');
        }
        const data = await res.arrayBuffer();
        const pointString = Buffer.from(data);

        // each file starts at 0 (0, 1024, 2048 etc)
        const min = (fileNum - 1) * constants.SIGNATURES_PER_FILE;
        const bytePosition = (value - min) * 32;
        // eslint-disable-next-line new-cap
        const signatureBuf = new Buffer.alloc(32);
        pointString.copy(signatureBuf, 0, bytePosition, bytePosition + 32);

        const x = new BN(signatureBuf);
        return Promise.resolve(setup.decompress(x));
    } catch (err) {
        throw err;
    }
};

export default setup;
