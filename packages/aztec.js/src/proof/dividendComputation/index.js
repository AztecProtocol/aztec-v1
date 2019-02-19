const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');

const Keccak = require('../../keccak');
const bn128 = require('../../bn128');
const verifier = require('./verifier');
const proofUtils = require('../proofUtils');

const { groupReduction } = bn128;
const { customError } = utils.errors;
const { ERROR_TYPES } = utils.constants;

/**
 * Constructs AZTEC dividend computations
 *
 * @module dividendComputation
*/
const dividendComputation = {};
dividendComputation.verifier = verifier;


/**
 * Construct AZTEC dividend computation proof transcript
 *
 * @method constructProof
 * @param {Note[]} notes array of AZTEC notes
 * @returns {{proofData:string[], challenge: string}} - proof data and challenge
 */
dividendComputation.constructProof = (notes, za, zb, sender) => {
    // Error checking
    if (notes.length !== 3) {
        throw customError(
            ERROR_TYPES.INCORRECT_NOTE_NUMBER,
            {
                data: `dividendComputation.constructProof has an incorrect number of input notes
                There are ${notes.length}, rather than the required 3.`,
            }
        );
    }

    proofUtils.parseInputs(notes, sender);
    // Array to store bk values later
    const bkArray = [];
    // convert z_a and z_b into BN instances if they aren't already
    let zaBN;
    let zbBN;

    const rollingHash = new Keccak();

    if (BN.isBN(za)) {
        zaBN = za;
    } else {
        zaBN = new BN(za);
    }

    if (BN.isBN(zb)) {
        zbBN = zb;
    } else {
        zbBN = new BN(zb);
    }
    // Check that proof data lies on the bn128 curve
    notes.forEach((note) => {
        const gammaOnCurve = bn128.curve.validate(note.gamma); // checking gamma point
        const sigmaOnCurve = bn128.curve.validate(note.sigma); // checking sigma point

        if ((gammaOnCurve === false) || (sigmaOnCurve === false)) {
            throw customError(
                ERROR_TYPES.NOT_ON_CURVE,
                {
                    data: `Is gamma on the curve?: ${gammaOnCurve}
                    Is sigma on the curve?: ${sigmaOnCurve}
                    One of these group elements is not on the bn128 curve`,
                }
            );
        }
    });

    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    let x = new BN(0).toRed(groupReduction);
    x = rollingHash.keccak(groupReduction);

    const blindingFactors = notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;

        // Calculating the blinding factors
        if (i === 0) { // input note
            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x
            x = rollingHash.keccak(groupReduction);
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(bk);
        }

        if (i === 1) { // output note
            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            x = rollingHash.keccak(groupReduction);
            bkArray.push(bk);
        }

        if (i === 2) { // residual note
            const zbRed = zbBN.toRed(groupReduction);
            const zaRed = zaBN.toRed(groupReduction);

            // bk_3 = (z_b)(bk_1) - (z_a)(bk_2)
            bk = (zbRed.redMul(bkArray[0])).redSub(zaRed.redMul(bkArray[1]));

            const xbk = bk.redMul(x); // xbk = bk*x
            const xba = ba.redMul(x); // xba = ba*x

            x = rollingHash.keccak(groupReduction);
            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            bkArray.push(bk);
        }

        return {
            bk,
            ba,
            B,
        };
    });

    const challenge = proofUtils.computeChallenge(sender, zaBN, zbBN, notes, blindingFactors);
    const proofDataUnformatted = blindingFactors.map((blindingFactor, i) => {
        const kBar = ((notes[i].k.redMul(challenge)).redAdd(blindingFactor.bk)).fromRed();
        const aBar = ((notes[i].a.redMul(challenge)).redAdd(blindingFactor.ba)).fromRed();

        return [
            `0x${padLeft(kBar.toString(16), 64)}`,
            `0x${padLeft(aBar.toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.y.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.y.fromRed().toString(16), 64)}`,
        ];
    });

    // Manipulating proofData into the array format required by the smart contract verifier
    const proofData = [...proofDataUnformatted[0], ...proofDataUnformatted[1], ...proofDataUnformatted[2]];
    return {
        proofDataUnformatted, // this has 6 elements
        proofData, // this has 18 elements
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

module.exports = dividendComputation;
