/* global artifacts, expect, contract, it:true */
const { BurnProof, encoder, MintProof, note } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const { keccak256, padLeft } = require('web3-utils');

const JoinSplitFluidABIEncoderTest = artifacts.require('./JoinSplitFluidABIEncoderTest');
let joinSplitFluidABIEncoderTest;
const { publicKey } = secp256k1.generateAccount();

const getMintNotes = async (currentMintCounter, newMintCounter, mintedNoteValues) => {
    const currentMintCounterNote = await note.create(publicKey, currentMintCounter);
    const newMintCounterNote = await note.create(publicKey, newMintCounter);
    const mintedNotes = await Promise.all(mintedNoteValues.map((mintedValue) => note.create(publicKey, mintedValue)));
    return { currentMintCounterNote, newMintCounterNote, mintedNotes };
};

const getDefaultMintNotes = async () => {
    const currentMintCounter = 30;
    const newMintCounter = 50;
    const mintedNoteValues = [10, 10];
    return getMintNotes(currentMintCounter, newMintCounter, mintedNoteValues);
};

contract.only('Mint ABI Encoder', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        joinSplitFluidABIEncoderTest = await JoinSplitFluidABIEncoderTest.new({ from: sender });
    });

    it('should encode output of a Mint proof', async () => {
        const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
        const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
        const data = proof.encodeABI();

        const result = await joinSplitFluidABIEncoderTest.validateJoinSplitFluid(data, sender, constants.CRS);
        const decoded = encoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
        expect(result).to.equal(proof.eth.output);

        expect(decoded[0].inputNotes[0].gamma.eq(currentMintCounterNote.gamma)).to.equal(true);
        expect(decoded[0].inputNotes[0].sigma.eq(currentMintCounterNote.sigma)).to.equal(true);
        expect(decoded[0].inputNotes[0].noteHash).to.equal(currentMintCounterNote.noteHash);
        expect(decoded[0].inputNotes[0].owner).to.equal(currentMintCounterNote.owner.toLowerCase());

        expect(decoded[0].outputNotes[0].gamma.eq(newMintCounterNote.gamma)).to.equal(true);
        expect(decoded[0].outputNotes[0].sigma.eq(newMintCounterNote.sigma)).to.equal(true);
        expect(decoded[0].outputNotes[0].noteHash).to.equal(newMintCounterNote.noteHash);
        expect(decoded[0].outputNotes[0].owner).to.equal(newMintCounterNote.owner.toLowerCase());

        expect(decoded[0].publicOwner).to.equal(proof.publicOwner.toString().toLowerCase());
        expect(decoded[0].publicValue).to.equal(proof.publicValue.toNumber());
        expect(decoded[0].challenge).to.equal(proof.challengeHex);

        expect(decoded[1].outputNotes[0].gamma.eq(mintedNotes[0].gamma)).to.equal(true);
        expect(decoded[1].outputNotes[0].sigma.eq(mintedNotes[0].sigma)).to.equal(true);
        expect(decoded[1].outputNotes[0].noteHash).to.equal(mintedNotes[0].noteHash);
        expect(decoded[1].outputNotes[0].owner).to.equal(mintedNotes[0].owner.toLowerCase());

        expect(decoded[1].outputNotes[1].gamma.eq(mintedNotes[1].gamma)).to.equal(true);
        expect(decoded[1].outputNotes[1].sigma.eq(mintedNotes[1].sigma)).to.equal(true);
        expect(decoded[1].outputNotes[1].noteHash).to.equal(mintedNotes[1].noteHash);
        expect(decoded[1].outputNotes[1].owner).to.equal(mintedNotes[1].owner.toLowerCase());

        expect(decoded[1].publicOwner).to.equal(proof.publicOwner.toString().toLowerCase());
        expect(decoded[1].publicValue).to.equal(proof.publicValue.toNumber());
        expect(decoded[1].challenge).to.equal(keccak256(proof.challengeHex));
    });
});

const getBurnNotes = async (currentBurnCounter, newBurnCounter, burnedNoteValues) => {
    const currentBurnCounterNote = await note.create(publicKey, currentBurnCounter);
    const newBurnCounterNote = await note.create(publicKey, newBurnCounter);
    const burnedNotes = await Promise.all(burnedNoteValues.map((burnedValue) => note.create(publicKey, burnedValue)));
    return { currentBurnCounterNote, newBurnCounterNote, burnedNotes };
};

const getDefaultBurnNotes = async () => {
    const currentBurnCounter = 30;
    const newBurnCounter = 50;
    const burnedNoteValues = [10, 10];
    return getBurnNotes(currentBurnCounter, newBurnCounter, burnedNoteValues);
};

contract.only('Burn ABI Encoder', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        joinSplitFluidABIEncoderTest = await JoinSplitFluidABIEncoderTest.new({ from: sender });
    });

    it('should encode output of a Burn proof', async () => {
        const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
        const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
        const data = proof.encodeABI();

        const result = await joinSplitFluidABIEncoderTest.validateJoinSplitFluid(data, sender, constants.CRS);
        expect(result).to.equal(proof.eth.output);

        const decoded = encoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
        expect(decoded[0].inputNotes[0].gamma.eq(currentBurnCounterNote.gamma)).to.equal(true);
        expect(decoded[0].inputNotes[0].sigma.eq(currentBurnCounterNote.sigma)).to.equal(true);
        expect(decoded[0].inputNotes[0].noteHash).to.equal(currentBurnCounterNote.noteHash);
        expect(decoded[0].inputNotes[0].owner).to.equal(currentBurnCounterNote.owner.toLowerCase());

        // First proof output (1 input note, 1 output note)
        expect(decoded[0].outputNotes[0].gamma.eq(newBurnCounterNote.gamma)).to.equal(true);
        expect(decoded[0].outputNotes[0].sigma.eq(newBurnCounterNote.sigma)).to.equal(true);
        expect(decoded[0].outputNotes[0].noteHash).to.equal(newBurnCounterNote.noteHash);
        expect(decoded[0].outputNotes[0].owner).to.equal(newBurnCounterNote.owner.toLowerCase());

        expect(decoded[0].publicOwner).to.equal(proof.publicOwner.toString().toLowerCase());
        expect(decoded[0].publicValue).to.equal(proof.publicValue.toNumber());
        expect(decoded[0].challenge).to.equal(proof.challengeHex);

        // Second proof output (there are 2 notes being burned)
        expect(decoded[1].outputNotes[0].gamma.eq(burnedNotes[0].gamma)).to.equal(true);
        expect(decoded[1].outputNotes[0].sigma.eq(burnedNotes[0].sigma)).to.equal(true);
        expect(decoded[1].outputNotes[0].noteHash).to.equal(burnedNotes[0].noteHash);
        expect(decoded[1].outputNotes[0].owner).to.equal(burnedNotes[0].owner.toLowerCase());

        expect(decoded[1].outputNotes[1].gamma.eq(burnedNotes[1].gamma)).to.equal(true);
        expect(decoded[1].outputNotes[1].sigma.eq(burnedNotes[1].sigma)).to.equal(true);
        expect(decoded[1].outputNotes[1].noteHash).to.equal(burnedNotes[1].noteHash);
        expect(decoded[1].outputNotes[1].owner).to.equal(burnedNotes[1].owner.toLowerCase());

        expect(decoded[1].publicOwner).to.equal(proof.publicOwner.toString().toLowerCase());
        expect(decoded[1].publicValue).to.equal(proof.publicValue.toNumber());
        expect(decoded[1].challenge).to.equal(keccak256(proof.challengeHex));
    });
});
