// /**
//  * @module initDatabase
//  *
//  * @dev This initialises the local trusted setup database, used for testing purposes.
//  * It contains 14,000 points - representing ~1.4% of the original in house trusted
//  * setup.
//  */

// import BN from 'bn.js';

// import path from 'path';
// import fs from 'fs';
// import { constants } from '@aztec/dev-utils';
// import setup from '../src/setup';

// const partialPath = path.posix.resolve(__dirname, 'localSetupDatabase');

// const { K_MAX_TEST } = constants;

// // Redfine K_MAX in the tests to be K_MAX_TEST, lower as using smaller
// // local point database
// constants.K_MAX = K_MAX_TEST;

// console.log('Initialised the local trusted setup database');

// /**
//  * Override the existing setup.fetchPoint() in src. Load a trusted setup signature
//  * point, sourcing it from the local trusted setup database rather
//  * than remotely.
//  *
//  * @method setup.fetchPoint
//  * @param {number} inputValue the integer whose negation was signed by the trusted setup key
//  * @returns {Object.<BN, BN>} x and y coordinates of signature point, in BN form
//  */
// setup.fetchPoint = async (inputValue) => {
//     const value = Number(inputValue);

//     if (value > constants.K_MAX) {
//         throw new Error('point not found');
//     }

//     return new Promise((resolve, reject) => {
//         const fileNum = Math.ceil(Number(value + 1) / constants.SIGNATURES_PER_FILE);
//         const fileName = path.posix.resolve(partialPath, `data${fileNum * constants.SIGNATURES_PER_FILE - 1}.dat`);

//         fs.readFile(fileName, (err, data) => {
//             if (err) {
//                 return reject(err);
//             }
//             // each file starts at 0 (0, 1024, 2048 etc)
//             const min = (fileNum - 1) * constants.SIGNATURES_PER_FILE;
//             const bytePosition = (value - min) * 32;
//             // eslint-disable-next-line new-cap
//             const signatureBuf = new Buffer.alloc(32);
//             data.copy(signatureBuf, 0, bytePosition, bytePosition + 32);

//             const x = new BN(signatureBuf);
//             return resolve(setup.decompress(x));
//         });
//     });
// };
