/**
 * Constructs AZTEC mint zero-knowledge proofs
 *
 * @module mint
 */
const { padLeft, sha3 } = require('web3-utils');

const verifier = require('./verifier');
const proofUtils = require('../proofUtils');
const joinSplit = require('../joinSplit');

const {
    inputCoder,
    outputCoder,
} = require('../../abiEncoder');

const mint = {};
mint.verifier = verifier;

/**
 * Encode a mint transaction
 * 
 * @method encodeMintTransaction
 * @memberof module:mint
 * @param {Note[]} newTotalMinted AZTEC note representing the new total minted number
 * @param {Note[]} oldTotalMinted AZTEC note representing the old total minted number
 * @param {Note[]} adjustedNotes notes being minted
 * @param {string} senderAddress the Ethereum address sending the AZTEC transaction (not necessarily the note signer)
 * @returns {Object} AZTEC proof data and expected output
 */
mint.encodeMintTransaction = ({
    newTotalMinted,
    oldTotalMinted,
    adjustedNotes,
    senderAddress,
}) => {
    const {
        proofData: proofDataRaw,
        challenge,
    } = mint.constructProof([newTotalMinted, oldTotalMinted, ...adjustedNotes], senderAddress);

    const inputNotes = [newTotalMinted];
    const outputNotes = [oldTotalMinted, ...adjustedNotes];

    const inputOwners = inputNotes.map(m => m.owner);
    const outputOwners = outputNotes.map(n => n.owner);
    const publicOwner = '0x0000000000000000000000000000000000000000';
    const publicValue = 0;

    const proofData = inputCoder.mint(
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
 * Construct AZTEC mint proof transcript
 *
 * @method constructProof
 * @param {Object[]} notes AZTEC notes
 * @param {string} sender the address calling the constructProof() function
 * @returns {string[]} proofData - constructed cryptographic proof data
 * @returns {string} challenge - crypographic challenge variable, part of the sigma protocol
 */
mint.constructProof = (notes, sender) => {
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

module.exports = mint;
