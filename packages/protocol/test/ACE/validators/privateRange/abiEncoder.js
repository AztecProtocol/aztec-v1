/* global artifacts, expect, contract, it:true */
const { PrivateRangeProof, encoder, note } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const secp256k1 = require('@aztec/secp256k1');
const { padLeft } = require('web3-utils');

const PrivateRangeABIEncoderTest = artifacts.require('./PrivateRangeABIEncoderTest');

let privateRangeABIEncoderTest;
const { publicKey } = secp256k1.generateAccount();

const getNotes = async (originalNoteValue, comparisonNoteValue, utilityNoteValue) => {
    const originalNote = await note.create(publicKey, originalNoteValue);
    const comparisonNote = await note.create(publicKey, comparisonNoteValue);
    const utilityNote = await note.create(publicKey, utilityNoteValue);
    return { originalNote, comparisonNote, utilityNote };
};

const getDefaultNotes = async () => {
    const originalNoteValue = 10;
    const comparisonNoteValue = 4;
    const utilityNoteValue = 6;
    const { originalNote, comparisonNote, utilityNote } = await getNotes(
        originalNoteValue,
        comparisonNoteValue,
        utilityNoteValue,
    );
    return { originalNote, comparisonNote, utilityNote };
};

contract('Private range ABI encoder', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        privateRangeABIEncoderTest = await PrivateRangeABIEncoderTest.new({ from: sender });
    });

    it('should encode output of private range proof', async () => {
        const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
        const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
        const data = proof.encodeABI();
        const result = await privateRangeABIEncoderTest.validatePrivateRange(data, sender, bn128.CRS, { from: sender });
        const decoded = encoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
        expect(result).to.equal(proof.eth.outputs);

        expect(decoded[0].inputNotes[0].gamma.eq(originalNote.gamma)).to.equal(true);
        expect(decoded[0].inputNotes[0].sigma.eq(originalNote.sigma)).to.equal(true);
        expect(decoded[0].inputNotes[0].noteHash).to.equal(originalNote.noteHash);
        expect(decoded[0].inputNotes[0].owner).to.equal(originalNote.owner.toLowerCase());

        expect(decoded[0].inputNotes[1].gamma.eq(comparisonNote.gamma)).to.equal(true);
        expect(decoded[0].inputNotes[1].sigma.eq(comparisonNote.sigma)).to.equal(true);
        expect(decoded[0].inputNotes[1].noteHash).to.equal(comparisonNote.noteHash);
        expect(decoded[0].inputNotes[1].owner).to.equal(comparisonNote.owner.toLowerCase());

        expect(decoded[0].outputNotes[0].gamma.eq(utilityNote.gamma)).to.equal(true);
        expect(decoded[0].outputNotes[0].sigma.eq(utilityNote.sigma)).to.equal(true);
        expect(decoded[0].outputNotes[0].noteHash).to.equal(utilityNote.noteHash);
        expect(decoded[0].outputNotes[0].owner).to.equal(utilityNote.owner.toLowerCase());

        expect(decoded[0].publicOwner).to.equal(proof.publicOwner.toLowerCase());
        expect(decoded[0].publicValue).to.equal(proof.publicValue.toNumber());
        expect(decoded[0].challenge).to.equal(proof.challengeHex);

        expect(result).to.equal(proof.eth.outputs);
    });
});
