/**
 * Constructs AZTEC bilateral swap zero-knowledge proofs
 *
 * @module proof.bilateralSwap
 */
const BN = require('bn.js');
const { padLeft } = require('web3-utils');
const utils = require('@aztec/dev-utils');
const crypto = require('crypto');

const bn128 = require('../../bn128');

const verifier = require('./verifier');
const proofUtils = require('../proofUtils');

const bilateralSwap = {};
bilateralSwap.verifier = verifier;

const { customError } = utils.errors;
const { errorTypes } = utils.constants;

const {
    inputCoder,
    outputCoder,
} = require('../../abiEncoder');

/**
 * Construct AZTEC bilateral swap proof transcript
 *
 * @method constructProof
 * @param {Object[], sender} notes array of AZTEC notes, sender address
 * @returns {{ proofData: string[], challenge: string }} - proof data and challenge
 */
bilateralSwap.constructProof = (notes, sender) => {
    const bkArray = [];

    // Check that proof data lies on the bn128 curve
    notes.forEach((note) => {
        const gammaOnCurve = bn128.curve.validate(note.gamma); // checking gamma point
        const sigmaOnCurve = bn128.curve.validate(note.sigma); // checking sigma point

        if ((gammaOnCurve === false) || (sigmaOnCurve === false)) {
            throw customError(
                errorTypes.NOT_ON_CURVE,
                {
                    message: 'A group element is not on the bn128 curve',
                    gammaOnCurve,
                    sigmaOnCurve,
                    note,
                }
            );
        }
    });

    proofUtils.parseInputs(notes, sender);

    const blindingFactors = notes.map((note, i) => {
        let bk = bn128.randomGroupScalar();
        const ba = bn128.randomGroupScalar();
        let B;


        /*
        Explanation of the below if/else
        - The purpose is to set bk1 = bk3 and bk2 = bk4
        - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
        - All bks are stored in a bkArray. When we arrive at the taker notes, we set bk equal to the bk of the corresponding
          maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the bkArray, and setting the current
          bk equal to the element at the resulting position.
        */

        // Maker notes
        if (i <= 1) {
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        } else { // taker notes
            bk = bkArray[i - 2];
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        }
        bkArray.push(bk);

        return {
            bk,
            ba,
            B,
        };
    });

    const challenge = proofUtils.computeChallenge(sender, notes, blindingFactors);

    const proofData = blindingFactors.map((blindingFactor, i) => {
        let kBar;

        // Only set the first 2 values of kBar - the third and fourth are later inferred
        // from a cryptographic relation. Set the third and fourth to random values
        if (i <= 1) {
            kBar = ((notes[i].k.redMul(challenge)).redAdd(blindingFactor.bk)).fromRed();
        } else {
            kBar = padLeft(new BN(crypto.randomBytes(32), 16).umod(bn128.curve.n).toString(16), 64);
        }

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
    return {
        proofData,
        challenge: `0x${padLeft(challenge.toString(16), 64)}`,
    };
};

bilateralSwap.encodeBilateralSwapTransaction = ({
    inputNotes,
    outputNotes,
    senderAddress,
}) => {
    const {
        proofData: proofDataRaw,
        challenge,
    } = bilateralSwap.constructProof([...inputNotes, ...outputNotes], senderAddress);
    const inputOwners = inputNotes.map(m => m.owner);
    const outputOwners = outputNotes.map(n => n.owner);

    const proofData = inputCoder.bilateralSwap(
        proofDataRaw,
        challenge,
        inputOwners,
        outputOwners,
        outputNotes
    );

    const publicOwner = '0x0000000000000000000000000000000000000000';
    const publicValue = 0;

    const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput };
};

module.exports = bilateralSwap;
