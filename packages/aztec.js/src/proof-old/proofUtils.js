/**
 * Constructs AZTEC bilateral swap zero-knowledge proofs
 *
 * @module proofUtils
 */

const {
    errors: { customError },
    constants,
} = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft } = require('web3-utils');

const bn128 = require('../bn128');
const Keccak = require('../keccak');
const note = require('../note');

const { BN128_GROUP_REDUCTION } = constants;
const zero = new BN(0).toRed(BN128_GROUP_REDUCTION);

const proofUtils = {};

/**
 * Checks the number of notes. Depending on the boolean argument, shouldThrow,
 * will either 1) immediately throw if incorrect number, or 2) push the error to
 * a supplied array of errors
 * @method checkNumNotes
 * @param {Object[]} notes - array of AZTEC notes
 * @param {integer} numNotes - desired number of notes
 * @param {boolean} shouldThrow - choose whether the tx should be thrown or the error simply recorded
 * @param {boolean} errors - input error recording array, set a default value
 */
proofUtils.checkNumNotes = (notes, numNotes, shouldThrow, errors = []) => {
    if (shouldThrow) {
        if (notes.length !== numNotes) {
            throw customError(constants.errorTypes.INCORRECT_NOTE_NUMBER, {
                message: 'Incorrect number of input notes',
                expectedNumber: numNotes,
                actualNumber: notes.length,
            });
        }
    } else if (!shouldThrow) {
        if (notes.length !== numNotes) {
            errors.push(constants.errorTypes.INCORRECT_NOTE_NUMBER);
        }
    } else {
        throw customError(constants.errorTypes.SHOULD_THROW_IS_UNDEFINED, {
            message: 'shouldThrow input argument not defined (3rd input argument)',
            shouldThrow,
        });
    }
};

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

    return hash.keccak(BN128_GROUP_REDUCTION);
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
        kPublic = new BN(0).toRed(BN128_GROUP_REDUCTION);
    }

    if (proofType === 'mint' || proofType === 'burn') {
        const numNotes = proofData.length;

        if (numNotes < 2) {
            errors.push(constants.errorTypes.INCORRECT_NOTE_NUMBER);
        }
    }

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
        rollingHash.appendPoint(result.gamma);
        rollingHash.appendPoint(result.sigma);
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
 * Use the redefined constants.K_MAX value of TEST_constants.K_MAX
 *
 * Generate a random note value that is less than constants.K_MAX
 * @method generateNoteValue
 * @returns {BN} - big number instance of an AZTEC note value
 */
proofUtils.randomNoteValue = () => {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(constants.K_MAX)).toNumber();
};

/**
 * Determine the kPublic value for a joinSplit transaction from the input values
 * (kIn) and output values (kOut).
 *
 * k corresponds to the value that a note represents
 *
 * @method getKPublic
 * @param {Number[]} kIn - array of input note values
 * @param {Number[]} kOut - array of output note values
 * @returns {Number} kPublic - integer corresponding to public tokens being converted or
 * redeemed
 */
proofUtils.getKPublic = (kIn, kOut) => {
    return kOut.reduce((acc, v) => acc - v, kIn.reduce((acc, v) => acc + v, 0));
};

/**
 * Generate a set of input and output note values that balance
 *
 * k corresponds to the value that a note represents
 *
 * @method generateBalancedNotes
 * @param {Number} nIn - number of input notes
 * @param {Number} nOut - number of output notes
 * @returns {Object} object containing balanced kIn and kOut values
 */
proofUtils.generateBalancedNotes = (nIn, nOut) => {
    const kIn = [...Array(nIn)].map(() => proofUtils.randomNoteValue());
    const kOut = [...Array(nOut)].map(() => proofUtils.randomNoteValue());
    let delta = proofUtils.getKPublic(kIn, kOut);
    while (delta > 0) {
        if (delta >= constants.K_MAX) {
            const k = proofUtils.randomNoteValue();
            kOut.push(k);
            delta -= k;
        } else {
            kOut.push(delta);
            delta = 0;
        }
    }
    while (delta < 0) {
        if (-delta >= constants.K_MAX) {
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
    let runningBk = new BN(0).toRed(BN128_GROUP_REDUCTION);
    const scalars = [...Array(n)].map((v, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        if (i === n - 1) {
            if (n === m) {
                bk = new BN(0).toRed(BN128_GROUP_REDUCTION).redSub(runningBk);
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
 * Computes the blinding factors and challenge from note array and final hash
 * Used for testing purposes
 * @method getBlindingFactorsAndChallenge
 * @param {string[]} noteArray - array of proof data from proof construction
 * @param {Hash} finalHash - hash object used to recover the challenge
 * @returns {BN[]} blinding factors - array of blinding factors
 * @returns {string} challenge - cryptographic variable used in the sigma protocol
 */
proofUtils.getBlindingFactorsAndChallenge = (noteArray, finalHash) => {
    const bkArray = [];
    const blindingFactors = noteArray.map((testNote, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();

        /*
        Explanation of the below if/else
        - The purpose is to set bk1 = bk3 and bk2 = bk4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All bks are stored in a bkArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the bkArray, and setting the current
          bk equal to the element at the resulting position.
        */

        // Taker notes
        if (i > 1) {
            bk = bkArray[i - 2];
        }

        const B = testNote.gamma.mul(bk).add(bn128.h.mul(ba));

        finalHash.appendPoint(B);
        bkArray.push(bk);

        return {
            bk,
            ba,
            B,
        };
    });
    const challenge = finalHash.keccak(BN128_GROUP_REDUCTION);
    return { blindingFactors, challenge };
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
    return hexBn.toRed(BN128_GROUP_REDUCTION);
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
 * Validate proof inputs are well formed
 *
 * @method isOnCurve
 * @param {BN[]} point - bn.js format of a point on the curve
 * @returns boolean - true if point is on curve, false if not
 */
proofUtils.isOnCurve = (point) => {
    const lhs = point.y.redSqr();
    const rhs = point.x
        .redSqr()
        .redMul(point.x)
        .redAdd(bn128.curve.b);
    return lhs.fromRed().eq(rhs.fromRed());
};

/**
 * Make test notes
 * @method makeTestNotes
 * @param {string[]} makerNoteValues - array of maker note values
 * @param {string[]} makerNoteValues - array of taker note values
 * @returns {Object[]} Array of AZTEC notes
 */
proofUtils.makeTestNotes = async (makerNoteValues, takerNoteValues) => {
    const noteValues = [...makerNoteValues, ...takerNoteValues];
    return Promise.all(noteValues.map((value) => note.create(secp256k1.generateAccount().publicKey, value)));
};

/**
 * Validate proof inputs are well formed
 *
 * @method parseInputs
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @param {string} kPublic public commitment being added to proof
 */
proofUtils.parseInputs = (notes, sender, m = 0, kPublic = new BN(0), proofIdentifier = 0) => {
    notes.forEach((testNote) => {
        if (!testNote.a.fromRed().lt(bn128.curve.n) || testNote.a.fromRed().eq(new BN(0))) {
            throw customError(constants.errorTypes.VIEWING_KEY_MALFORMED, {
                message: 'Viewing key is malformed',
                viewingKey: testNote.a.fromRed(),
                criteria: `Viewing key should be less than ${bn128.curve.n}
                    and greater than zero`,
            });
        }

        if (!testNote.k.fromRed().lt(new BN(constants.K_MAX))) {
            throw customError(constants.errorTypes.NOTE_VALUE_TOO_BIG, {
                message: 'Note value is equal to or greater than constants.K_MAX',
                noteValue: testNote.k.fromRed(),
                K_MAX: constants.K_MAX,
            });
        }

        if (testNote.gamma.isInfinity() || testNote.sigma.isInfinity()) {
            throw customError(constants.errorTypes.POINT_AT_INFINITY, {
                message: 'One of the note points is at infinity',
                gamma: testNote.gamma.isInfinity(),
                sigma: testNote.sigma.isInfinity(),
            });
        }

        if (!proofUtils.isOnCurve(testNote.gamma) || !proofUtils.isOnCurve(testNote.sigma)) {
            throw customError(constants.errorTypes.NOT_ON_CURVE, {
                message: 'A note group element is not on the curve',
                gammaOnCurve: proofUtils.isOnCurve(testNote.gamma),
                sigmaOnCurve: proofUtils.isOnCurve(testNote.sigma),
            });
        }
    });

    if (!kPublic.lt(bn128.curve.n)) {
        throw customError(constants.errorTypes.KPUBLIC_MALFORMED, {
            message: 'kPublic is too big',
            kPublic,
            maxValue: bn128.curve.n,
        });
    }

    if (m > notes.length) {
        throw customError(constants.errorTypes.M_TOO_BIG, {
            message: 'm (input note number) is greater than the total number of notes',
            m,
            numberNotes: notes.length,
        });
    }

    if (proofIdentifier === 'mint' || proofIdentifier === 'burn') {
        const numNotes = notes.length;
        if (numNotes < 2) {
            throw customError(constants.errorTypes.INCORRECT_NOTE_NUMBER, {
                message: 'There is less than 2 notes, this is not possible in a mint proof',
                numNotes,
            });
        }
    }
};

/**
 * Generate a random Ethereum address
 * @method randomAddress
 * @returns {string} random Ethereum address
 */
proofUtils.randomAddress = () => {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
};

/**
 * Checks whether signatures can be generated using the input arguments to a joinSplit proof
 *
 * @method checkSignatureParams
 * @param {string[]} inputNoteOwners - array of the input note owners
 * @param {string} validatorAddress - Ethereum address of the transaction validator
 * @param {Note[]} inputNotes - array of the input notes
 */
proofUtils.checkSignatureParams = (inputNoteOwners, validatorAddress, inputNotes) => {
    if (inputNoteOwners.length > 0 && validatorAddress.length === 0) {
        throw customError(constants.errorTypes.UNABLE_TO_CALCULATE_SIGNATURE, {
            message: 'inputNoteOwners have been passed, but without a validator address',
            inputNoteOwners,
            validatorAddress,
        });
    }

    if (inputNoteOwners.length > 0 && inputNotes.length === 0) {
        throw customError(constants.errorTypes.UNABLE_TO_CALCULATE_SIGNATURE, {
            message: 'inputNoteOwners have been passed, but without any input notes',
            inputNoteOwners,
            validatorAddress,
        });
    }
};

/**
 * Recovers the blinding factors and challenge
 * Used for testing purposes
 * @method getBlindingFactorsAndChallenge
 * @param {string[]} proofDataBn - array of proof data from proof construction
 * @param {string} formattedChallenge - challenge variable
 * @param {Hash} finalHash - hash object used to recover the challenge
 * @returns {BN[]} blinding factors - array of blinding factors
 * @returns {string} challenge - cryptographic variable used in the sigma protocol
 */
proofUtils.recoverBlindingFactorsAndChallenge = (proofDataBn, formattedChallenge, finalHash) => {
    const kBarArray = [];

    // Validate that the commitments lie on the bn128 curve
    proofDataBn.forEach((proofElement) => {
        bn128.curve.validate(proofElement[6]); // checking gamma point
        bn128.curve.validate(proofElement[7]); // checking sigma point
    });

    const recoveredBlindingFactors = proofDataBn.map((proofElement, i) => {
        let kBar = proofElement[0];
        const aBar = proofElement[1];
        const gamma = proofElement[6];
        const sigma = proofElement[7];

        /*
        Explanation of the below if/else
        - The purpose is to set kBar1 = kBar3 and kBar2 = kBar4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All kBars are stored in a kBarArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the kBarArray, and setting the current
          kBar equal to the element at the resulting position.
        */

        // Taker notes
        if (i > 1) {
            kBar = kBarArray[i - 2];
        }

        const B = gamma
            .mul(kBar)
            .add(bn128.h.mul(aBar))
            .add(sigma.mul(formattedChallenge).neg());

        finalHash.appendPoint(B);
        kBarArray.push(kBar);

        return {
            kBar,
            B,
        };
    });
    const recoveredChallenge = finalHash.keccak(BN128_GROUP_REDUCTION);
    return { recoveredBlindingFactors, recoveredChallenge };
};

module.exports = proofUtils;
