/**
 * @module initDatabase
 *
 * This initialises the local trusted setup database, used for testing purposes.
 * It contains 14,000 points - representing ~1.4% of the original in house trusted
 * setup.
 *
 * This script redefines the setup.fetchPoint() method that attempts to fetch a point remotely.
 * It also redefines the K_MAX constant in the @aztec/dev-utils package to be TEST_K_MAX - the new lower
 * value of K_MAX for tests.
 *
 * This script is called first in the test folder when tests are running, overriding existing behaviour.
 */

const BN = require('bn.js');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const { constants } = require('@aztec/dev-utils');
const {
    setup,
    proof: { proofUtils },
} = require('aztec.js');

const partialPath = path.posix.resolve(__dirname, 'localSetupDatabase');

const { TEST_K_MAX } = constants;

// Redfine K_MAX in the tests
constants.K_MAX = TEST_K_MAX;

console.log('Initialised the local trusted setup database');

/**
 * Override the existing setup.fetchPoint in src. Load a trusted setup signature
 * point, sourcing it from the local trusted setup database rather
 * than remotely.
 *
 * @method setup.fetchPoint
 * @param {number} inputValue the integer whose negation was signed by the trusted setup key
 * @returns {Object.<BN, BN>} x and y coordinates of signature point, in BN form
 */
setup.fetchPoint = async (inputValue) => {
    const value = Number(inputValue);

    if (value > constants.K_MAX) {
        throw new Error('point not found');
    }

    return new Promise((resolve, reject) => {
        const fileNum = Math.ceil(Number(value + 1) / constants.SIGNATURES_PER_FILE);
        const fileName = path.posix.resolve(partialPath, `data${fileNum * constants.SIGNATURES_PER_FILE - 1}.dat`);

        fs.readFile(fileName, (err, data) => {
            if (err) {
                return reject(err);
            }
            // each file starts at 0 (0, 1024, 2048 etc)
            const min = (fileNum - 1) * constants.SIGNATURES_PER_FILE;
            const bytePosition = (value - min) * 32;
            // eslint-disable-next-line new-cap
            const signatureBuf = new Buffer.alloc(32);
            data.copy(signatureBuf, 0, bytePosition, bytePosition + 32);

            const x = new BN(signatureBuf);
            return resolve(setup.decompress(x));
        });
    });
};

/**
 * Override the behaviour of this method in the src folder.
 * Use the redefined constants.K_MAX value of TEST_constants.K_MAX
 *
 * Generate a random note value that is less than constants.K_MAX
 * @method generateNoteValue
 * @returns {BN} - big number instance of an AZTEC note value
 */
proofUtils.randomNoteValue = () => {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(constants.K_MAX)).toNumber();
};
