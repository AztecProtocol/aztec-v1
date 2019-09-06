const aztec = require('aztec.js');
const devUtils = require('@aztec/dev-utils');

const {
    proofs: { MINT_PROOF },
} = devUtils;
const { JoinSplitProof, MintProof } = aztec;

const sum = (arrayToSum) => arrayToSum.reduce((a, b) => a + b, 0);

const mintNotes = async (values, ownerPublicKey, fromAddress, sender, zkAsset) => {
    const notes = await Promise.all(values.map((i) => aztec.note.create(ownerPublicKey, i, fromAddress)));
    const newMintCounterNote = await aztec.note.create(ownerPublicKey, sum(values));
    const zeroMintCounterNote = await aztec.note.createZeroValueNote();

    const mintProof = new MintProof(zeroMintCounterNote, newMintCounterNote, notes, sender);

    const mintData = mintProof.encodeABI();
    await zkAsset.confidentialMint(MINT_PROOF, mintData, { from: sender });
    const noteHashes = notes.map((note) => note.noteHash);
    return { notes, values, noteHashes };
};

const spendNotesWithFunctions = async (
    amount,
    sellerPublicKey,
    buyerPublicKey,
    buyerFunds,
    buyerNotes,
    zkAsset,
    wallet,
    sender,
) => {
    const invoice = await aztec.note.create(sellerPublicKey, amount);
    const change = await aztec.note.create(buyerPublicKey, buyerFunds - amount, wallet.address);
    const sendProof = new JoinSplitProof(buyerNotes, [invoice, change], wallet.address, 0, wallet.address);
    const sendProofData = sendProof.encodeABI(zkAsset.address);
    const result = await wallet.batchConfidentialTransfer(sendProofData, zkAsset.address, wallet.address, { from: sender });
    return result;
};

const approveAndSpendNotes = async (
    amount,
    sellerPublicKey,
    buyerPublicKey,
    buyerFunds,
    buyerNotes,
    buyerNoteHashes,
    zkAsset,
    wallet,
    sender,
) => {
    const invoice = await aztec.note.create(sellerPublicKey, amount);
    const change = await aztec.note.create(buyerPublicKey, buyerFunds - amount, wallet.address);
    const sendProof = new JoinSplitProof(buyerNotes, [invoice, change], wallet.address, 0, wallet.address);
    const sendProofData = sendProof.encodeABI(zkAsset.address);
    const result = await wallet.spendNotes(buyerNoteHashes, sendProofData, zkAsset.address, wallet.address, { from: sender });
    return result;
};

module.exports = {
    sum,
    mintNotes,
    spendNotesWithFunctions,
    approveAndSpendNotes,
};
