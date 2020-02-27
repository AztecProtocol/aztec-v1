const { ProofUtils, note } = require('aztec.js');
const { publicKey: standardPubKey, privateKey } = require('../../../getOwnerAccount');

const generateOutputNotes = async (values, publicKey = standardPubKey) =>
    Promise.all(values.map(async (value) => note.create(publicKey, value)));

const generateDepositProofInputs = async ({ outputNoteValues = [20, 30], publicKey = standardPubKey } = {}) => {
    const inputNotes = [];
    const outputNotes = await generateOutputNotes(outputNoteValues, publicKey);

    const publicValue = ProofUtils.getPublicValue([], outputNoteValues);

    const depositAmount = outputNoteValues.reduce((accum, val) => accum + val, 0);

    return {
        inputNotes,
        outputNotes,
        publicValue,
        depositAmount,
    };
};

const getOwnerPrivateKey = () => {
    return privateKey;
};

module.exports = {
    generateOutputNotes,
    generateDepositProofInputs,
    getOwnerPrivateKey,
};
