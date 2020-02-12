const { ProofUtils, note } = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');
const bip39 = require('bip39');
const dotenv = require('dotenv');
const hdkey = require('ethereumjs-wallet/hdkey');

dotenv.config();
const mnemonic = process.env.TEST_MNEMONIC;
const seed = bip39.mnemonicToSeed(mnemonic);
const hdwallet = hdkey.fromMasterSeed(seed);

const noteOwnerWallet = hdwallet.derivePath("m/44'/60'/0'/0/0").getWallet();
const noteOwnerAccount = secp256k1.accountFromPrivateKey(noteOwnerWallet.getPrivateKeyString());

const generateOutputNotes = async (values, publicKey = noteOwnerAccount.publicKey) =>
    Promise.all(values.map(async (value) => note.create(publicKey, value)));

const generateDepositProofInputs = async ({ outputNoteValues = [20, 30], publicKey = noteOwnerAccount.publicKey } = {}) => {
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
    return noteOwnerAccount.privateKey;
};

module.exports = {
    generateOutputNotes,
    generateDepositProofInputs,
    getOwnerPrivateKey,
};
