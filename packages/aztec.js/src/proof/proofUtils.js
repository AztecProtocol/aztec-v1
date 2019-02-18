
const BN = require('bn.js');
const utils = require('@aztec/dev-utils');

const bn128 = require('../bn128');
const Keccak = require('../keccak');


const { groupReduction } = bn128;
const { K_MAX } = require('../params');


const proofUtils = {};
const { customError } = utils.errors;
const { ERROR_TYPES } = utils.constants;

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
proofUtils.parseInputs = (notes, m, sender, kPublic) => {
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
            ERROR_TYPES.KPUBLIC_TOO_BIG,
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
