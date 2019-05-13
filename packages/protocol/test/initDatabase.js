/**
 * @module initDatabase
 *
 * This initialises the local trusted setup database, used for testing purposes.
 * It contains 14,000 points - representing ~1.5% of the original in house experimental
 * setup.
 *
 * This script redefines functions that either try to fetch a point remotely, or
 * use the original value of K_MAX rather than the testing value.
 */

const BN = require('bn.js');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const { constants } = require('@aztec/dev-utils');
const {
    setup,
    proof: { proofUtils },
} = require('aztec.js');

const partialPath = path.posix.resolve(__dirname, 'localSetupDatabase');
const TEST_K_MAX = 14336;

proofUtils.randomNoteValue = () => {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(TEST_K_MAX)).toNumber();
};

proofUtils.generateBalancedNotes = (nIn, nOut) => {
    const kIn = [...Array(nIn)].map(() => proofUtils.randomNoteValue());
    const kOut = [...Array(nOut)].map(() => proofUtils.randomNoteValue());
    let delta = proofUtils.getKPublic(kIn, kOut);
    while (delta > 0) {
        if (delta >= TEST_K_MAX) {
            const k = proofUtils.randomNoteValue();
            kOut.push(k);
            delta -= k;
        } else {
            kOut.push(delta);
            delta = 0;
        }
    }
    while (delta < 0) {
        if (-delta >= TEST_K_MAX) {
            const k = proofUtils.randomNoteValue();
            kIn.push(k);
            delta += k;
        } else {
            kIn.push(-delta);
            delta = 0;
        }
    }
    return { kIn, kOut };
};

setup.fetchPoint = async (inputValue) => {
    const value = Number(inputValue);

    if (value > TEST_K_MAX) {
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
