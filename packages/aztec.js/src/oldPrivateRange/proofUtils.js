/**
 * Constructs AZTEC bilateral swap zero-knowledge proofs
 *
 * @module proofUtils
 */

const {
    errors: { customError },
    constants,
} = require('@aztec/dev-utils');
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft } = require('web3-utils');

const bn128 = require('../bn128');
const Keccak = require('../keccak');

const proofUtils = {};


/**
 * Compute the Fiat-Shamir heuristic-ified challenge variable.
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method computeChallenge
 * @param {string} sender Ethereum address of transaction sender
 * @param {string} kPublic public commitment being added to proof
 * @param {number} m number of input notes
 * @param {Object[]} notes array of AZTEC notes
 * @param {Object[]} blindingFactors array of computed blinding factors, one for each note
 */
proofUtils.computeChallenge = (...challengeVariables) => {
    const hash = new Keccak();
    const recurse = (inputs) => {
        inputs.forEach((challengeVar) => {
            if (typeof challengeVar === 'string') {
                hash.appendBN(new BN(challengeVar.slice(2), 16));
            } else if (typeof challengeVar === 'number') {
                hash.appendBN(new BN(challengeVar));
            } else if (BN.isBN(challengeVar)) {
                hash.appendBN(challengeVar.umod(bn128.curve.n));
            } else if (Array.isArray(challengeVar)) {
                recurse(challengeVar);
            } else if (challengeVar.gamma) {
                hash.appendPoint(challengeVar.gamma);
                hash.appendPoint(challengeVar.sigma);
            } else if (challengeVar.B) {
                hash.appendPoint(challengeVar.B);
            } else {
                throw customError(constants.errorTypes.NO_ADD_CHALLENGEVAR, {
                    message: 'Can not add the challenge variable to the hash',
                    challengeVar,
                    type: typeof challengeVar,
                });
            }
        });
    };
    recurse(challengeVariables);

    return hash.keccak(constants.BN128_GROUP_REDUCTION);
};

/**
 * Converts proof data to bn.js format, calculates gamma and sigma
 * then appends these to the end
 * @method convertToBNAndAppendPoints
 * @param {string[]} proofData - array of proof data from proof construction
 * @param {string[]} errors - record of all errors that are thrown
 * @returns {BN[]} proofData - array of proof data in bn.js format
 */
proofUtils.convertToBNAndAppendPoints = (proofData, errors) => {
    const proofDataBn = proofData.map((proofElement) => {
        // Reconstruct gamma
        const xGamma = proofElement[2];
        const yGamma = proofElement[3];
        const gamma = proofUtils.hexToGroupElement(xGamma, yGamma, errors);

        // Reconstruct sigma
        const xSigma = proofElement[4];
        const ySigma = proofElement[5];
        const sigma = proofUtils.hexToGroupElement(xSigma, ySigma, errors);

        const kBar = proofUtils.hexToGroupScalar(proofElement[0], errors);
        const aBar = proofUtils.hexToGroupScalar(proofElement[1], errors);

        return [kBar, aBar, xGamma, yGamma, xSigma, ySigma, gamma, sigma];
    });

    return proofDataBn;
};


/**
 * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
 *
 * @method convertTranscript
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string[]} errors container for discovered errors
 * @returns {Object[]} notes - array of AZTEC notes
 * @returns {Hash} rolling hash - hash used to generate x in pairing optimisation
 * @returns {string} challenge - cryptographic challenge in
 * @returns {BN} kPublic - pubic value being converted in the transaction
 */
proofUtils.convertTranscript = (proofData, m, challengeHex, errors, proofType) => {
    if (proofType !== 'joinSplit' && proofType !== 'burn' && proofType !== 'mint') {
        throw new Error('Enter join-split, mint or burn in string format as the proofType variable');
    }

    const challenge = proofUtils.hexToGroupScalar(challengeHex, errors);
    const n = proofData.length;
    let kPublic;

    if (proofType === 'joinSplit') {
        kPublic = proofUtils.hexToGroupScalar(proofData[proofData.length - 1][0], errors, true);
    } else {
        kPublic = new BN(0).toRed(constants.BN128_GROUP_REDUCTION);
    }

    if (proofType === 'mint' || proofType === 'burn') {
        const numNotes = proofData.length;

        if (numNotes < 2) {
            errors.push(constants.errorTypes.INCORRECT_NOTE_NUMBER);
        }
    }

    const zero = new BN(0).toRed(constants.BN128_GROUP_REDUCTION);
    let runningKBar = zero.redSub(kPublic).redMul(challenge);
    const rollingHash = new Keccak();

    const notes = proofData.map((testNote, i) => {
        let kBar;
        if (i === n - 1) {
            if (n === m) {
                kBar = zero.redSub(runningKBar);
            } else {
                kBar = runningKBar;
            }
            if (kBar.fromRed().eq(new BN(0))) {
                errors.push(constants.errorTypes.SCALAR_IS_ZERO);
            }
        } else {
            kBar = proofUtils.hexToGroupScalar(testNote[0], errors);
            if (i >= m) {
                runningKBar = runningKBar.redSub(kBar);
            } else {
                runningKBar = runningKBar.redAdd(kBar);
            }
        }
        const result = {
            kBar,
            aBar: proofUtils.hexToGroupScalar(testNote[1], errors),
            gamma: proofUtils.hexToGroupElement(testNote[2], testNote[3], errors),
            sigma: proofUtils.hexToGroupElement(testNote[4], testNote[5], errors),
        };
        rollingHash.append(result.gamma);
        rollingHash.append(result.sigma);
        return result;
    });
    return {
        notes,
        rollingHash,
        challenge,
        kPublic,
    };
};

/**
 * Generate random blinding scalars, conditional on the AZTEC join-split proof statement
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method generateBlindingScalars
 * @memberof proof.joinSplit
 * @param {number} n number of notes
 * @param {number} m number of input notes
 */
proofUtils.generateBlindingScalars = (n, m) => {
    let runningBk = new BN(0).toRed(constants.BN128_GROUP_REDUCTION);
    const scalars = [...Array(n)].map((v, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        if (i === n - 1) {
            if (n === m) {
                bk = new BN(0).toRed(constants.BN128_GROUP_REDUCTION).redSub(runningBk);
            } else {
                bk = runningBk;
            }
        }

        if (i + 1 > m) {
            runningBk = runningBk.redSub(bk);
        } else {
            runningBk = runningBk.redAdd(bk);
        }
        return { bk, ba };
    });
    return scalars;
};


/**
 * Converts a hexadecimal input into a scalar bn.js
 * @method hexToGroupScalar
 * @param {string} hex - hex input
 * @param {string[]} errors - collection of all errors that occurred
 * @param {boolean} canbeZero - control to determine hex input can be zero
 * @returns {BN} bn.js formatted version of the scalar
 */
proofUtils.hexToGroupScalar = (hex, errors, canBeZero = false) => {
    const hexBn = new BN(hex.slice(2), 16);
    if (!hexBn.lt(bn128.curve.n)) {
        errors.push(constants.errorTypes.SCALAR_TOO_BIG);
    }
    if (!canBeZero && hexBn.eq(new BN(0))) {
        errors.push(constants.errorTypes.SCALAR_IS_ZERO);
    }
    return hexBn.toRed(constants.BN128_GROUP_REDUCTION);
};

/**
 * Converts a hexadecimal input to a group element
 * @method hexToGroupScalar
 * @param {string} xHex - hexadecimal representation of x coordinate
 * @param {string} yHex - hexadecimal representation of y coordinate
 * @param {string[]} errors - collection of all errors that occurred
 * @returns {BN} bn.js formatted version of a point on the bn128 curve
 */
proofUtils.hexToGroupElement = (xHex, yHex, errors) => {
    let x = new BN(xHex.slice(2), 16);
    let y = new BN(yHex.slice(2), 16);
    if (!x.lt(bn128.curve.p)) {
        errors.push(constants.errorTypes.X_TOO_BIG);
    }
    if (!y.lt(bn128.curve.p)) {
        errors.push(constants.errorTypes.Y_TOO_BIG);
    }
    x = x.toRed(bn128.curve.red);
    y = y.toRed(bn128.curve.red);
    const lhs = y.redSqr();
    const rhs = x
        .redSqr()
        .redMul(x)
        .redAdd(bn128.curve.b);
    if (!lhs.fromRed().eq(rhs.fromRed())) {
        errors.push(constants.errorTypes.NOT_ON_CURVE);
    }
    return bn128.curve.point(x, y);
};


/**
 * Generate a random Ethereum address
 * @method randomAddress
 * @returns {string} random Ethereum address
 */
proofUtils.randomAddress = () => {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
};


module.exports = proofUtils;
