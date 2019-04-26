/**
 * Constructs AZTEC dividend computations
 *
 * @module publicRange
 */

const devUtils = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const proofUtils = require('../proofUtils');
const verifier = require('./verifier');

const { inputCoder, outputCoder } = require('../../abiEncoder');

const { customError } = devUtils.errors;
const { errorTypes } = devUtils.constants;

const publicRange = {};
publicRange.verifier = verifier;

/**
 * Construct blinding factors
 *
 * @method constructBlindingFactors
 * @param {Object[]} notes AZTEC notes
 * @param {Number} kPublicBN - BN instance of the public integer being compared against
 * @returns {Object[]} blinding factors
 */
publicRange.constructBlindingFactors = (notes) => {
    const bkArray = [];

    return notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;

        // Calculating the blinding factors
        if (i === 0) {
            // input note
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            bkArray.push(bk);
        }

        if (i > 0) {
            // output note
            bk = bkArray[i - 1]; // .sub(kPublicBN);
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            bkArray.push(bk);
        }
        return {
            bk,
            ba,
            B,
        };
    });
};

/**
 * Construct AZTEC public range proof transcript
 *
 * @method constructProof
 * @param {Object[]} notes - array of AZTEC notes
 * @param {Number} kPublicBN - public integer being compared against
 * @param {sender} sender - Ethereum address
 * @returns {string[]} proofData - constructed cryptographic proof data
 * @returns {string} challenge - crypographic challenge variable, part of the sigma protocol
 */
publicRange.constructProof = (notes, kPublic, sender) => {
    const numNotes = 2;

    // Used to check the number of input notes. Boolean argument specifies whether the
    // check should throw if not satisfied, or if we seek to collect all errors
    // and only throw at the end. Here, set to true - immediately throw if error
    proofUtils.checkNumNotes(notes, numNotes, true);

    proofUtils.parseInputs(notes, sender);
    // convert z_a and z_b into BN instances if they aren't already
    let kPublicBN;

    const rollingHash = new Keccak();

    if (BN.isBN(kPublic)) {
        kPublicBN = kPublic;
    } else {
        kPublicBN = new BN(kPublic);
    }
    // Check that proof data lies on the bn128 curve
    notes.forEach((note) => {
        const gammaOnCurve = bn128.curve.validate(note.gamma); // checking gamma point
        const sigmaOnCurve = bn128.curve.validate(note.sigma); // checking sigma point

        if (gammaOnCurve === false || sigmaOnCurve === false) {
            throw customError(errorTypes.NOT_ON_CURVE, {
                message: 'A group element is not on the bn128 curve',
                gammaOnCurve,
                sigmaOnCurve,
                note,
            });
        }
    });

    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    const blindingFactors = publicRange.constructBlindingFactors(notes, kPublicBN);

    const challenge = proofUtils.computeChallenge(sender, kPublicBN, notes, blindingFactors);
    const proofData = blindingFactors.map((blindingFactor, i) => {
        const kBar = notes[i].k
            .redMul(challenge)
            .redAdd(blindingFactor.bk)
            .fromRed();
        const aBar = notes[i].a
            .redMul(challenge)
            .redAdd(blindingFactor.ba)
            .fromRed();

        return [
            `0x${padLeft(kBar.toString(16), 64)}`,
            `0x${padLeft(aBar.toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].gamma.y.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.x.fromRed().toString(16), 64)}`,
            `0x${padLeft(notes[i].sigma.y.fromRed().toString(16), 64)}`,
        ];
    });

    return {
        proofData,
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

/**
 * Encode a dividend computation transaction
 *
 * @method encodePublicRangeTransaction
 * @memberof module:publicRange
 * @param {Note[]} inputNotes input AZTEC notes
 * @param {Note[]} outputNotes output AZTEC notes
 * @param {Number} y - public integer being compared against
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @returns {Object} AZTEC proof data and expected output
 */
publicRange.encodePublicRangeTransaction = ({ inputNotes, outputNotes, kPublic, senderAddress }) => {
    const { proofData: proofDataRaw, challenge } = publicRange.constructProof(
        [...inputNotes, ...outputNotes],
        kPublic,
        senderAddress,
    );

    const inputOwners = inputNotes.map((m) => m.owner);
    const outputOwners = outputNotes.map((n) => n.owner);

    const proofData = inputCoder.publicRange(proofDataRaw, challenge, kPublic, inputOwners, outputOwners, outputNotes);

    const publicValue = kPublic;
    const publicOwner = devUtils.constants.addresses.ZERO_ADDRESS;

    const expectedOutput = `0x${outputCoder
        .encodeProofOutputs([
            {
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue,
                challenge,
            },
        ])
        .slice(0x42)}`;

    return { proofData, expectedOutput };
};

module.exports = publicRange;
