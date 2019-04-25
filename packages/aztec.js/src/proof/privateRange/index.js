/**
 * Constructs AZTEC private range zero-knowledge proofs
 *
 * @module privateRange
 */
const devUtils = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const bn128 = require('../../bn128');
const proofUtils = require('../proofUtils');
const verifier = require('./verifier');
const Keccak = require('../../keccak');

const privateRange = {};
privateRange.verifier = verifier;

const { groupReduction } = bn128;

const { inputCoder, outputCoder } = require('../../abiEncoder');

/**
 * Construct blinding factors
 *
 * @method constructBlindingFactors
 * @param {Object[]} notes AZTEC notes
 * @returns {Object[]} blinding factors
 */
privateRange.constructBlindingFactors = (notes, rollingHash) => {
    const bkArray = [];
    let bk;
    let B;
    let x = new BN(0).toRed(groupReduction);

    return notes.map((note, i) => {
        const ba = bn128.randomGroupScalar();
        bk = bn128.randomGroupScalar();

        if (i === 0) {
            B = note.gamma.mul(bk).add(bn128.h.mul(ba));
        } else if (i === 1) {
            x = rollingHash.keccak(groupReduction);
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);

            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
        } else if (i === 2) {
            bk = bkArray[i - 2].redSub(bkArray[i - 1]);

            x = rollingHash.keccak(groupReduction);
            const xbk = bk.redMul(x);
            const xba = ba.redMul(x);

            B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
        }
        bkArray.push(bk);

        return {
            bk,
            ba,
            B,
        };
    });
};

/**
 * Construct AZTEC private range proof transcript
 *
 * @method constructProof
 * @param {Object[]} notes AZTEC notes
 * @param {string} sender the address calling the constructProof() function
 * @returns {string[]} proofData - constructed cryptographic proof data
 * @returns {string} challenge - crypographic challenge variable, part of the sigma protocol
 */
privateRange.constructProof = (notes, sender) => {
    // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
    const rollingHash = new Keccak();


    proofUtils.parseInputs(notes, sender);

    notes.forEach((note) => {
        rollingHash.append(note.gamma);
        rollingHash.append(note.sigma);
    });

    const blindingFactors = privateRange.constructBlindingFactors(notes, rollingHash);

    const challenge = proofUtils.computeChallenge(sender, notes, blindingFactors);
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
 * Encode a private range proof transaction
 *
 * @method encodePrivateRangeTransaction
 * @memberof module:privateRange
 * @param {Note[]} inputNotes input AZTEC notes
 * @param {Note[]} outputNotes output AZTEC notes
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @returns {Object} AZTEC proof data and expected output
 */
privateRange.encodePrivateRangeTransaction = ({ originalNote, comparisonNote, utilityNote, senderAddress }) => {
    const { proofData: proofDataRaw, challenge } = privateRange.constructProof(
        [originalNote, comparisonNote, utilityNote],
        senderAddress,
    );

    const inputNotes = [originalNote, comparisonNote];
    const outputNotes = [utilityNote];
    const inputOwners = inputNotes.map((m) => m.owner);
    const outputOwner = [utilityNote.owner];

    const proofData = inputCoder.privateRange(proofDataRaw, challenge, inputOwners, outputOwner, outputNotes);
    const publicOwner = devUtils.constants.addresses.ZERO_ADDRESS;
    const publicValue = 0;

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

module.exports = privateRange;
