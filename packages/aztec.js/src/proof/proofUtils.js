
const BN = require('bn.js');
const utils = require('@aztec/dev-utils');

const bn128 = require('../bn128');
const Keccak = require('../keccak');
const secp256k1 = require('../secp256k1');
const notesConstruct = require('../note');


const { groupReduction } = bn128;
const { K_MAX } = require('../params');

const proofUtils = {};
const { customError } = utils.errors;
const { ERROR_TYPES } = utils.constants;
const zero = new BN(0).toRed(groupReduction);

proofUtils.makeTestNotes = (makerNoteValues, takerNoteValues) => {
    const noteValues = [...makerNoteValues, ...takerNoteValues];
    return noteValues.map(value => notesConstruct.create(secp256k1.generateAccount().publicKey, value));
};


proofUtils.checkNumNotesAndThrow = (notes) => {
    if (notes.length !== 3) {
        throw customError(
            ERROR_TYPES.INCORRECT_NOTE_NUMBER,
            {
                data: `dividendComputation.constructProof has an incorrect number of input notes
                There are ${notes.length}, rather than the required 3.`,
            }
        );
    }
};

proofUtils.checkNumNotesNoThrow = (notes, errors) => {
    if (notes.length !== 3) {
        errors.push(ERROR_TYPES.INCORRECT_NOTE_NUMBER);
    }
};

proofUtils.convertToBNAndAppendPoints = (proofData) => {
    const proofDataBn = proofData.map((proofElement) => {
        // Reconstruct gamma
        const xGamma = new BN(proofElement[2].slice(2), 16).toRed(bn128.curve.red);
        const yGamma = new BN(proofElement[3].slice(2), 16).toRed(bn128.curve.red);
        const gamma = bn128.curve.point(xGamma, yGamma);

        // Reconstruct sigma
        const xSigma = new BN(proofElement[4].slice(2), 16).toRed(bn128.curve.red);
        const ySigma = new BN(proofElement[5].slice(2), 16).toRed(bn128.curve.red);
        const sigma = bn128.curve.point(xSigma, ySigma);

        return [
            new BN(proofElement[0].slice(2), 16).toRed(groupReduction), // kbar
            new BN(proofElement[1].slice(2), 16).toRed(groupReduction), // aBar
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

proofUtils.hexToGroupScalar = (hex, errors, canBeZero = false) => {
    const hexBn = new BN(hex.slice(2), 16);
    if (!hexBn.lt(bn128.curve.n)) {
        errors.push(ERROR_TYPES.SCALAR_TOO_BIG);
    }
    if (!canBeZero && hexBn.eq(new BN(0))) {
        errors.push(ERROR_TYPES.SCALAR_IS_ZERO);
    }
    return hexBn.toRed(groupReduction);
};

proofUtils.hexToGroupElement = (xHex, yHex, errors) => {
    let x = new BN(xHex.slice(2), 16);
    let y = new BN(yHex.slice(2), 16);
    if (!x.lt(bn128.curve.p)) {
        errors.push(ERROR_TYPES.X_TOO_BIG);
    }
    if (!y.lt(bn128.curve.p)) {
        errors.push(ERROR_TYPES.Y_TOO_BIG);
    }
    x = x.toRed(bn128.curve.red);
    y = y.toRed(bn128.curve.red);
    const lhs = y.redSqr();
    const rhs = x.redSqr().redMul(x).redAdd(bn128.curve.b);
    if (!lhs.fromRed().eq(rhs.fromRed())) {
        errors.push(ERROR_TYPES.NOT_ON_CURVE);
    }
    return bn128.curve.point(x, y);
};

/**
 * Convert ABI encoded proof transcript back into BN.js form (for scalars) and elliptic.js form (for points)
 *
 * @method convertTranscript
 * @memberof module:proof.joinSplit.verifier
 * @param {string[]} proofData AZTEC join-split zero-knowledge proof data
 * @param {number} m number of input notes
 * @param {string} challengeHex hex-string formatted proof challenge
 * @param {string[]} errors container for discovered errors
 */
proofUtils.convertTranscript = (proofData, m, challengeHex, errors) => {
    const challenge = proofUtils.hexToGroupScalar(challengeHex, errors);
    const n = proofData.length;
    const kPublic = proofUtils.hexToGroupScalar(proofData[proofData.length - 1][0], errors, true);
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
                errors.push(ERROR_TYPES.SCALAR_IS_ZERO);
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
                console.log('error can not add: ', challengeVar);
                throw customError(
                    ERROR_TYPES.NO_ADD_CHALLENGEVAR,
                    {
                        message: `I don't know how to add ${challengeVar} to hash`,
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
                ERROR_TYPES.VIEWING_KEY_MALFORMED,
                {
                    message: `Viewing key is malformed. It is either not less than 
                    ${bn128.curve.n} or it is equal to zero`,
                }
            );
        }

        if (!note.k.fromRed().lt(new BN(K_MAX))) {
            throw customError(
                ERROR_TYPES.NOTE_VALUE_TOO_BIG,
                {
                    message: `Note value is equal to or greater than K_Max 
                                - ${K_MAX}`,
                }
            );
        }

        if (note.gamma.isInfinity() || note.sigma.isInfinity()) {
            throw customError(
                ERROR_TYPES.POINT_AT_INFINITY,
                {
                    message: `Is gamma at infinity?: ${note.gamma.isInfinity()} 
                            Is sigma at infinity?: ${note.sigma.isInfinity()}`,
                }
            );
        }

        if (!proofUtils.isOnCurve(note.gamma) || !proofUtils.isOnCurve(note.sigma)) {
            throw customError(
                ERROR_TYPES.NOT_ON_CURVE,
                {
                    message: `Is gamma on the curve?: ${!proofUtils.isOnCurve(note.gamma)}
                    Is sigma on the curve?: ${!proofUtils.isOnCurve(note.sigma)}`,
                }
            );
        }
    });

    if (!kPublic.lt(bn128.curve.n)) {
        throw customError(
            ERROR_TYPES.KPUBLIC_MALFORMED,
            {
                message: `K_public is equal to or greater than  
                ${bn128.curve.n}`,
            }
        );
    }

    if (m > notes.length) {
        throw customError(
            ERROR_TYPES.M_TOO_BIG,
            {
                message: `m (the number of input notes) is greater than the total 
                number of notes. m: ${m}, number of notes: ${notes.length}`,
            }
        );
    }
};

proofUtils.isOnCurve = (point) => {
    const lhs = point.y.redSqr();
    const rhs = point.x.redSqr().redMul(point.x).redAdd(bn128.curve.b);
    return (lhs.fromRed().eq(rhs.fromRed()));
};

module.exports = proofUtils;
