/* global artifacts, expect, contract, it:true */
const { DividendProof, encoder, note } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const secp256k1 = require('@aztec/secp256k1');
const { padLeft } = require('web3-utils');

const DividendABIEncoderTest = artifacts.require('./DividendABIEncoderTest');

let dividendAbiEncoderTest;
const { publicKey } = secp256k1.generateAccount();

const getNotes = async (notionalNoteValue, residualNoteValue, targetNoteValue) => {
    const notionalNote = await note.create(publicKey, notionalNoteValue);
    const residualNote = await note.create(publicKey, residualNoteValue);
    const targetNote = await note.create(publicKey, targetNoteValue);
    return { notionalNote, residualNote, targetNote };
};

const getDefaultNotes = async () => {
    const notionalNoteValue = 90;
    const targetNoteValue = 4;
    const residualNoteValue = 50;
    const { notionalNote, residualNote, targetNote } = await getNotes(notionalNoteValue, residualNoteValue, targetNoteValue);
    const za = 100;
    const zb = 5;
    return { notionalNote, residualNote, targetNote, za, zb };
};

contract('Dividend ABI Encoder', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        dividendAbiEncoderTest = await DividendABIEncoderTest.new({ from: sender });
    });

    it('should encode output of Dividend proof', async () => {
        const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
        const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
        const data = proof.encodeABI();

        const result = await dividendAbiEncoderTest.validateDividend(data, sender, bn128.CRS);
        const decoded = encoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
        expect(result).to.equal(proof.eth.outputs);

        expect(decoded[0].inputNotes[0].gamma.eq(notionalNote.gamma)).to.equal(true);
        expect(decoded[0].inputNotes[0].sigma.eq(notionalNote.sigma)).to.equal(true);
        expect(decoded[0].inputNotes[0].noteHash).to.equal(notionalNote.noteHash);
        expect(decoded[0].inputNotes[0].owner).to.equal(notionalNote.owner.toLowerCase());

        expect(decoded[0].outputNotes[0].gamma.eq(targetNote.gamma)).to.equal(true);
        expect(decoded[0].outputNotes[0].sigma.eq(targetNote.sigma)).to.equal(true);
        expect(decoded[0].outputNotes[0].noteHash).to.equal(targetNote.noteHash);
        expect(decoded[0].outputNotes[0].owner).to.equal(targetNote.owner.toLowerCase());

        expect(decoded[0].outputNotes[1].gamma.eq(residualNote.gamma)).to.equal(true);
        expect(decoded[0].outputNotes[1].sigma.eq(residualNote.sigma)).to.equal(true);
        expect(decoded[0].outputNotes[1].noteHash).to.equal(residualNote.noteHash);
        expect(decoded[0].outputNotes[1].owner).to.equal(residualNote.owner.toLowerCase());

        expect(decoded[0].publicOwner).to.equal(proof.publicOwner.toLowerCase());
        expect(decoded[0].publicValue).to.equal(proof.publicValue.toNumber());
        expect(decoded[0].challenge).to.equal(proof.challengeHex);
    });
});
