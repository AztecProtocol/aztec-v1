/**
 * Constructs AZTEC bilateral swap zero-knowledge proofs
 *
 * @module proofUtils
 */

const { padLeft } = require('web3-utils');
const BN = require('bn.js');
const { errors: { customError }, constants, constants: { K_MAX } } = require('@aztec/dev-utils');
const crypto = require('crypto');

const bn128 = require('../bn128');
const Keccak = require('../keccak');
const secp256k1 = require('../secp256k1');
const notesConstruct = require('../note');


const { groupReduction } = bn128;

const proofUtils = {};
// const { customError } = errors;
const { errorTypes } = constants;

const zero = new BN(0).toRed(groupReduction);

/**
 * Make test notes
 * @method makeTestNotes
 * @memberof module:proofUtils
 * @param {string[]} makerNoteValues - array of maker note values 
 * @param {string[]} makerNoteValues - array of taker note values
 * @returns {[Notes{}]} - array of AZTEC notes
 */
proofUtils.makeTestNotes = (makerNoteValues, takerNoteValues) => {
    const noteValues = [...makerNoteValues, ...takerNoteValues];
    return noteValues.map(value => notesConstruct.create(secp256k1.generateAccount().publicKey, value));
};

proofUtils.randomAddress = () => {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'), 64)}`;
};

/**
 * Generate a random note value that is less than K_MAX
 * @method generateNoteValue
 * @memberof module:proofUtils
 * @returns {BN} - big number instance of an AZTEC note value
 */
proofUtils.generateNoteValue = () => {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
};

/**
 * Checks the number of notes. Depending on the boolean argument, shouldThrow, 
 * will either 1) immediately throw if incorrect number, or 2) push the error to 
 * a supplied array of errors
 * @method checkNumNotes
 * @memberof module:proofUtils
 * @param {Object[]} notes - array of AZTEC notes
 * @param {integer} numNotes - desired number of notes
 * @param {boolean} shouldThrow - choose whether the tx should be thrown or the error simply recorded
 * @param {boolean} errors - input error recording array, set a default value

 */
proofUtils.checkNumNotes = (notes, numNotes, shouldThrow, errors = []) => {
    if (shouldThrow) {
        if (notes.length !== numNotes) {
            throw customError(
                errorTypes.INCORRECT_NOTE_NUMBER,
                {
                    message: 'Incorrect number of input notes',
                    expectedNumber: numNotes,
                    actualNumber: notes.length,
                }
            );
        }
    } else if (!shouldThrow) {
        if (notes.length !== numNotes) {
            errors.push(errorTypes.INCORRECT_NOTE_NUMBER);
        }
    } else {
        throw customError(
            errorTypes.SHOULD_THROW_IS_UNDEFINED,
            {
                message: 'shouldThrow input argument not defined (3rd input argument)',
                shouldThrow,
            }
        );
    }
};

/**
 * Converts proof data to bn.js format, calculates gamma and sigma 
 * then appends these to the end
 * @method convertToBNAndAppendPoints
 * @memberof module:proofUtils
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

        return [
            kBar,
            aBar,
            xGamma,
            yGamma,
            xSigma,
            ySigma,
            gamma,
            sigma,
        ];
    });

    return proofDataBn;
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
    let runningBk = new BN(0).toRed(groupReduction);
    const scalars = [...Array(n)].map((v, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        if (i === (n - 1)) {
            if (n === m) {
                bk = new BN(0).toRed(groupReduction).redSub(runningBk);
            } else {
                bk = runningBk;
            }
        }

        if ((i + 1) > m) {
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
 * @memberof module:proofUtils
 * @param {string[]} noteArray - array of proof data from proof construction
 * @param {Hash} finalHash - hash object used to recover the challenge
 * @returns { blindingFactors: BN[] , challenge: string} proofData - array of proof data in bn.js format
 */
proofUtils.getBlindingFactorsAndChallenge = (noteArray, finalHash) => {
    const bkArray = [];
    const blindingFactors = noteArray.map((note, i) => {
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

        const B = note.gamma.mul(bk).add(bn128.h.mul(ba));

        finalHash.append(B);
        bkArray.push(bk);

        return {
            bk,
            ba,
            B,
        };
    });
    const challenge = finalHash.keccak(groupReduction);
    return { blindingFactors, challenge };
};

proofUtils.randomAddress = () => {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
};

/**
 * Recovers the blinding factors and challenge
 * Used for testing purposes
 * @method getBlindingFactorsAndChallenge
 * @memberof module:proofUtils
 * @param {string[]} proofDataBn - array of proof data from proof construction
 * @param {string} formattedChallenge - challenge variable
 * @param {Hash} finalHash - hash object used to recover the challenge
 * @returns { blindingFactors: BN[] , challenge: string} proofData - array of proof data in bn.js format
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

        const B = gamma.mul(kBar).add(bn128.h.mul(aBar)).add(sigma.mul(formattedChallenge).neg());

        finalHash.append(B);
        kBarArray.push(kBar);

        return {
            kBar,
            B,
        };
    });
    const recoveredChallenge = finalHash.keccak(groupReduction);
    return { recoveredBlindingFactors, recoveredChallenge };
};

/**
 * Converts a hexadecimal input into a scalar bn.js
 * @method hexToGroupScalar
 * @memberof module:proofUtils
 * @param {string} hex - hex input
 * @param {string[]} errors - collection of all errors that occurred
 * @param {boolean} canbeZero - control to determine hex input can be zero
 * @returns {BN} bn.js formatted version of the scalar
 */
proofUtils.hexToGroupScalar = (hex, errors, canBeZero = false) => {
    const hexBn = new BN(hex.slice(2), 16);
    if (!hexBn.lt(bn128.curve.n)) {
        errors.push(errorTypes.SCALAR_TOO_BIG);
    }
    if (!canBeZero && hexBn.eq(new BN(0))) {
        errors.push(errorTypes.SCALAR_IS_ZERO);
    }
    return hexBn.toRed(groupReduction);
};

/**
 * Converts a hexadecimal input to a group element
 * @method hexToGroupScalar
 * @memberof module:proofUtils
 * @param {string} xHex - hexadecimal representation of x coordinate
 * @param {string} yHex - hexadecimal representation of y coordinate
 * @param {string[]} errors - collection of all errors that occurred
 * @returns {BN} bn.js formatted version of a point on the bn128 curve
 */
proofUtils.hexToGroupElement = (xHex, yHex, errors) => {
    let x = new BN(xHex.slice(2), 16);
    let y = new BN(yHex.slice(2), 16);
    if (!x.lt(bn128.curve.p)) {
        errors.push(errorTypes.X_TOO_BIG);
    }
    if (!y.lt(bn128.curve.p)) {
        errors.push(errorTypes.Y_TOO_BIG);
    }
    x = x.toRed(bn128.curve.red);
    y = y.toRed(bn128.curve.red);
    const lhs = y.redSqr();
    const rhs = x.redSqr().redMul(x).redAdd(bn128.curve.b);
    if (!lhs.fromRed().eq(rhs.fromRed())) {
        errors.push(errorTypes.NOT_ON_CURVE);
    }
    return bn128.curve.point(x, y);
};

/**
 * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
 *
 * @method convertTranscript
 * @memberof module:proofUtils
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string[]} errors container for discovered errors
 * @returns { notes: Object[], rollingHash: Hash, challenge: string, kPublic: BN} necessary proof variables in required format
 */
proofUtils.convertTranscript = (proofData, m, challengeHex, errors, proofType) => {
    if (proofType !== 'joinSplit' && proofType !== 'mint' && proofType !== 'burn') {
        throw new Error('Enter joinsplit, mint or burn in string format as the proofType variable');
    }

    const challenge = proofUtils.hexToGroupScalar(challengeHex, errors);
    const n = proofData.length;
    let kPublic;

    if (proofType === 'joinSplit') {
        kPublic = proofUtils.hexToGroupScalar(proofData[proofData.length - 1][0], errors, true);
    } else {
        kPublic = new BN(0).toRed(groupReduction);
    }

    let runningKBar = zero.redSub(kPublic).redMul(challenge);
    const rollingHash = new Keccak();

    const notes = proofData.map((note, i) => {
        let kBar;
        if (i === n - 1) {
            if (n === m) {
                kBar = zero.redSub(runningKBar);
            } else {
                kBar = runningKBar;
            }
            if (kBar.fromRed().eq(new BN(0))) {
                errors.push(errorTypes.SCALAR_IS_ZERO);
            }
        } else {
            kBar = proofUtils.hexToGroupScalar(note[0], errors);
            if (i >= m) {
                runningKBar = runningKBar.redSub(kBar);
            } else {
                runningKBar = runningKBar.redAdd(kBar);
            }
        }
        const result = {
            kBar,
            aBar: proofUtils.hexToGroupScalar(note[1], errors),
            gamma: proofUtils.hexToGroupElement(note[2], note[3], errors),
            sigma: proofUtils.hexToGroupElement(note[4], note[5], errors),
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
 * Compute the Fiat-Shamir heuristic-ified challenge variable.
 *   Separated out into a distinct method so that we can stub this for extractor tests
 *
 * @method computeChallenge
 * @memberof proofUtils
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
            if (typeof (challengeVar) === 'string') {
                hash.appendBN(new BN(challengeVar.slice(2), 16));
            } else if (typeof (challengeVar) === 'number') {
                hash.appendBN(new BN(challengeVar));
            } else if (BN.isBN(challengeVar)) {
                hash.appendBN(challengeVar.umod(bn128.curve.n));
            } else if (Array.isArray(challengeVar)) {
                recurse(challengeVar);
            } else if (challengeVar.gamma) {
                hash.append(challengeVar.gamma);
                hash.append(challengeVar.sigma);
            } else if (challengeVar.B) {
                hash.append(challengeVar.B);
            } else {
                throw customError(
                    errorTypes.NO_ADD_CHALLENGEVAR,
                    {
                        message: 'Can not add the challenge variable to the hash',
                        challengeVar,
                        type: typeof (challengeVar),
                    }
                );
            }
        });
    };
    recurse(challengeVariables);

    return hash.keccak(groupReduction);
};

/**
 * Validate proof inputs are well formed
 *
 * @method parseInputs
 * @memberof proof.joinSplit
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @param {string} kPublic public commitment being added to proof
 */
proofUtils.parseInputs = (notes, sender, m = 0, kPublic = new BN(0)) => {
    notes.forEach((note) => {
        if (!note.a.fromRed().lt(bn128.curve.n) || note.a.fromRed().eq(new BN(0))) {
            throw customError(
                errorTypes.VIEWING_KEY_MALFORMED,
                {
                    message: 'Viewing key is malformed',
                    viewingKey: note.a.fromRed(),
                    criteria: `Viewing key should be less than ${bn128.curve.n} 
                    and greater than zero`,
                }
            );
        }

        if (!note.k.fromRed().lt(new BN(K_MAX))) {
            throw customError(
                errorTypes.NOTE_VALUE_TOO_BIG,
                {
                    message: 'Note value is equal to or greater than K_Max',
                    noteValue: note.k.fromRed(),
                    K_MAX,
                }
            );
        }

        if (note.gamma.isInfinity() || note.sigma.isInfinity()) {
            throw customError(
                errorTypes.POINT_AT_INFINITY,
                {
                    message: 'One of the note points is at infinity',
                    gamma: note.gamma.isInfinity(),
                    sigma: note.sigma.isInfinity(),
                }
            );
        }

        if (!proofUtils.isOnCurve(note.gamma) || !proofUtils.isOnCurve(note.sigma)) {
            throw customError(
                errorTypes.NOT_ON_CURVE,
                {
                    message: 'A note group element is not on the curve',
                    gammaOnCurve: proofUtils.isOnCurve(note.gamma),
                    sigmaOnCurve: proofUtils.isOnCurve(note.sigma),
                }
            );
        }
    });

    if (!kPublic.lt(bn128.curve.n)) {
        throw customError(
            errorTypes.KPUBLIC_MALFORMED,
            {
                message: 'kPublic is too big',
                kPublic,
                maxValue: bn128.curve.n,
            }
        );
    }

    if (m > notes.length) {
        throw customError(
            errorTypes.M_TOO_BIG,
            {
                message: 'm (input note number) is greater than the total number of notes',
                m,
                numberNotes: notes.length,
            }
        );
    }
};

/**
 * Validate proof inputs are well formed
 *
 * @method isOnCurve
 * @memberof proofUtils
 * @param {BN[]} point - bn.js format of a point on the curve
 * @returns boolean - true if point is on curve, false if not
 */
proofUtils.isOnCurve = (point) => {
    const lhs = point.y.redSqr();
    const rhs = point.x.redSqr().redMul(point.x).redAdd(bn128.curve.b);
    return (lhs.fromRed().eq(rhs.fromRed()));
};

module.exports = proofUtils;
