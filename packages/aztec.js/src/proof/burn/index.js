/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module proof.burn
 */
const { padLeft, sha3 } = require('web3-utils');

const verifier = require('./verifier');
const proofUtils = require('../proofUtils');
const joinSplit = require('../joinSplit');

const {
    inputCoder,
    outputCoder,
} = require('../../abiEncoder');

const burn = {};
burn.verifier = verifier;

burn.encodeBurnTransaction = ({
    newTotalBurned,
    oldTotalBurned,
    adjustedNotes,
    senderAddress,
}) => {
    const {
        proofData: proofDataRaw,
        challenge,
    } = burn.constructProof([newTotalBurned, oldTotalBurned, ...adjustedNotes], senderAddress);

    const inputNotes = [newTotalBurned];
    const outputNotes = [oldTotalBurned, ...adjustedNotes];

    const inputOwners = inputNotes.map(m => m.owner);
    const outputOwners = outputNotes.map(n => n.owner);
    const publicOwner = '0x0000000000000000000000000000000000000000';
    const publicValue = 0;

    // const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12), proofDataRaw.slice(12, 18)]);

    const proofData = inputCoder.burn(
        proofDataRaw,
        challenge,
        inputOwners,
        outputOwners,
        outputNotes
    );

    const expectedOutput = `0x${outputCoder.encodeProofOutputs([{
        inputNotes: [{
            ...outputNotes[0],
            forceMetadata: true,
        }],
        outputNotes: [{
            ...inputNotes[0],
            forceNoMetadata: true,
        }],
        publicOwner,
        publicValue,
        challenge,
    },
    {
        inputNotes: [],
        outputNotes: outputNotes.slice(1),
        publicOwner,
        publicValue,
        challenge: `0x${padLeft(sha3(challenge).slice(2), 64)}`,
    },
    ]).slice(0x42)}`;
    return { proofData, expectedOutput, challenge };
};


/**
 * Construct AZTEC burn proof transcript
 *
 * @method constructProof
 * @memberof proof.burn
 * @param {Object[]} notes array of AZTEC notes
 * @param {number} m number of input notes
 * @param {string} sender Ethereum address of transaction sender
 * @returns {Object} proof data and challenge
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

module.exports = burn;
