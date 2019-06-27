/* global artifacts, expect, contract, it:true */
const { PublicRangeProof, encoder, note } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const { padLeft } = require('web3-utils');
const secp256k1 = require('@aztec/secp256k1');

const PublicRangeABIEncoderTest = artifacts.require('./PublicRangeABIEncoderTest');

let publicRangeAbiEncoderTest;
const { publicKey } = secp256k1.generateAccount();

const getNotes = async (originalNoteValue, utilityNoteValue) => {
    const originalNote = await note.create(publicKey, originalNoteValue);
    const utilityNote = await note.create(publicKey, utilityNoteValue);
    return { originalNote, utilityNote };
};

const getDefaultNotes = async () => {
    const originalNoteValue = 50;
    const utilityNoteValue = 40;
    const publicInteger = 10;
    const isGreaterOrEqual = true;

    const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
    return { originalNote, utilityNote, publicInteger, isGreaterOrEqual };
};

contract('Public range ABI Encoder', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        publicRangeAbiEncoderTest = await PublicRangeABIEncoderTest.new({ from: sender });
    });

    it('should encode output of public range proof', async () => {
        const { originalNote, utilityNote, publicInteger, isGreaterOrEqual } = await getDefaultNotes();

        const proof = new PublicRangeProof(originalNote, publicInteger, sender, isGreaterOrEqual, utilityNote);
        const data = proof.encodeABI();
        const result = await publicRangeAbiEncoderTest.validatePublicRange(data, sender, bn128.CRS);
        const decoded = encoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
        expect(result).to.equal(proof.eth.outputs);

        expect(decoded[0].inputNotes[0].gamma.eq(originalNote.gamma)).to.equal(true);
        expect(decoded[0].inputNotes[0].sigma.eq(originalNote.sigma)).to.equal(true);
        expect(decoded[0].inputNotes[0].noteHash).to.equal(originalNote.noteHash);
        expect(decoded[0].inputNotes[0].owner).to.equal(originalNote.owner.toLowerCase());

        expect(decoded[0].outputNotes[0].gamma.eq(utilityNote.gamma)).to.equal(true);
        expect(decoded[0].outputNotes[0].sigma.eq(utilityNote.sigma)).to.equal(true);
        expect(decoded[0].outputNotes[0].noteHash).to.equal(utilityNote.noteHash);
        expect(decoded[0].outputNotes[0].owner).to.equal(utilityNote.owner.toLowerCase());

        expect(decoded[0].publicOwner).to.equal(proof.publicOwner.toLowerCase());
        expect(decoded[0].publicValue).to.equal(proof.publicValue.toNumber());
        expect(decoded[0].challenge).to.equal(proof.challengeHex);
    });
});
