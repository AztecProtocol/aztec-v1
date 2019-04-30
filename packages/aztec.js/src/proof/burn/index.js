/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module burn
 */
const { constants } = require('@aztec/dev-utils');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../abiEncoder');
const joinSplit = require('../joinSplit');
const proofUtils = require('../proofUtils');
const verifier = require('./verifier');

const burn = {};
burn.verifier = verifier;

/**
 * Construct AZTEC burn proof transcript
 *
 * @method constructProof
 * @memberof burn
 * @param {Note[]} notes array of AZTEC notes
 * @param {string} sender Ethereum address of transaction sender
 * @returns {string[]} proofData - constructed cryptographic proof data
 * @returns {string} challenge - crypographic challenge variable, part of the sigma protocol
 */
burn.constructProof = (notes, sender) => {
    const m = 1;
    const kPublic = 0;
    let notesArray;

    if (!Array.isArray(notes)) {
        notesArray = [notes];
    } else {
        notesArray = notes;
    }

    proofUtils.parseInputs(notesArray, sender);

    const { proofData, challenge } = joinSplit.constructProof(notesArray, m, sender, kPublic);
    return { proofData, challenge };
};

/**
 * Encode a burn transaction
 *
 * @method encodeBurnTransaction
 * @memberof module:burn
 * @param {Note[]} newTotalBurned AZTEC note representing the new total burned number
 * @param {Note[]} oldTotalBurned AZTEC note representing the old total burned number
 * @param {Note[]} adjustedNotes notes being burned
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @returns {Object} AZTEC proof data and expected output
 */
burn.encodeBurnTransaction = ({ newTotalBurned, oldTotalBurned, adjustedNotes, senderAddress }) => {
    const { proofData: proofDataRaw, challenge } = burn.constructProof(
        [newTotalBurned, oldTotalBurned, ...adjustedNotes],
        senderAddress,
    );

    const inputNotes = [newTotalBurned];
    const outputNotes = [oldTotalBurned, ...adjustedNotes];

    const inputOwners = inputNotes.map((m) => m.owner);
    const outputOwners = outputNotes.map((n) => n.owner);
    const publicOwner = constants.addresses.ZERO_ADDRESS;
    const publicValue = 0;

    const proofData = inputCoder.burn(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

    const expectedOutput = `0x${outputCoder
        .encodeProofOutputs([
            {
                inputNotes: [
                    {
                        ...outputNotes[0],
                        forceMetadata: true,
                    },
                ],
                outputNotes: [
                    {
                        ...inputNotes[0],
                        forceNoMetadata: true,
                    },
                ],
                publicOwner,
                publicValue,
                challenge,
            },
            {
                inputNotes: [],
                outputNotes: outputNotes.slice(1),
                publicOwner,
                publicValue,
                challenge: `0x${padLeft(keccak256(challenge).slice(2), 64)}`,
            },
        ])
        .slice(0x42)}`;
    return { proofData, expectedOutput, challenge };
};

module.exports = burn;
