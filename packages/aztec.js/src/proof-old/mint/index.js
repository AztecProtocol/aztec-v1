/**
 * Constructs AZTEC mint zero-knowledge proofs
 *
 * @module mint
 */
const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../encoder');
const joinSplit = require('../joinSplit');
const proofUtils = require('../proofUtils');
const verifier = require('./verifier');

const mint = {};
mint.verifier = verifier;

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
mint.encodeMintTransaction = ({ newTotalMinted, oldTotalMinted, adjustedNotes, senderAddress }) => {
    const { proofData: proofDataRaw, challenge } = mint.constructProof(
        [newTotalMinted, oldTotalMinted, ...adjustedNotes],
        senderAddress,
    );

    const inputNotes = [newTotalMinted];
    const outputNotes = [oldTotalMinted, ...adjustedNotes];

    const inputOwners = inputNotes.map((m) => m.owner);
    const outputOwners = outputNotes.map((n) => n.owner);
    const publicOwner = constants.addresses.ZERO_ADDRESS;
    const publicValue = new BN(0);

    const proofData = inputCoder.joinSplitFluid(proofDataRaw, challenge, inputOwners, outputOwners, outputNotes);

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

module.exports = mint;
