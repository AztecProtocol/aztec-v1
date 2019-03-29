/**
 * Constructs AZTEC join-split zero-knowledge proofs
 *
 * @module proof.mint
 */
const verifier = require('./verifier');
const proofUtils = require('../proofUtils');
const joinSplit = require('../joinSplit');


const {
    inputCoder,
    outputCoder,
} = require('../../abiEncoder');

const mint = {};
mint.verifier = verifier;

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

    // const proofDataRawFormatted = [proofDataRaw.slice(0, 6)].concat([proofDataRaw.slice(6, 12), proofDataRaw.slice(12, 18)]);

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
    },
    {
        inputNotes: [],
        outputNotes: outputNotes.slice(1),
        publicOwner,
        publicValue,
    },
    ]).slice(0x42)}`;
    return { proofData, expectedOutput, challenge };
};

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
