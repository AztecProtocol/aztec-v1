/* eslint-disable object-curly-newline */
/* global artifacts, contract, describe, expect, it: true */
const { encoder, JoinSplitProof, note } = require('aztec.js');

const secp256k1 = require('@aztec/secp256k1');
const truffleAssert = require('truffle-assertions');
const { padLeft } = require('web3-utils');

const NoteUtils = artifacts.require('./NoteUtilsTest');

const { outputCoder } = encoder;

const aztecAccount = secp256k1.generateAccount();

const getNotes = async (inputNoteValues = [], outputNoteValues = []) => {
    const inputNotes = await Promise.all(
        inputNoteValues.map((inputNoteValue) => note.create(aztecAccount.publicKey, inputNoteValue)),
    );
    const outputNotes = await Promise.all(
        outputNoteValues.map((outputNoteValue) => note.create(aztecAccount.publicKey, outputNoteValue)),
    );
    return { inputNotes, outputNotes };
};

const getDefaultNotes = async () => {
    const inputNoteValues = [10, 10];
    const outputNoteValues = [20, 20];
    const publicValue = -20;
    const { inputNotes, outputNotes } = await getNotes(inputNoteValues, outputNoteValues);
    return { inputNotes, outputNotes, publicValue };
};

contract('NoteUtils', async (accounts) => {
    let noteUtils;
    const publicOwner = accounts[0];
    const sender = accounts[0];

    before(async () => {
        noteUtils = await NoteUtils.new();
    });

    describe('Success States', async () => {
        it('should return the correct length of the abi encoded proof outputs array', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const result = await noteUtils.getLength(proof.eth.outputs);
            expect(result.toNumber()).to.equal(1);
        });

        it('should return the correct length of the abi encoded notes array', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const encodedOutputNotes = outputCoder.getOutputNotes(proof.output);
            const formattedOutputNotes = `0x${encodedOutputNotes.slice(0x40)}`;
            const result = await noteUtils.getLength(formattedOutputNotes);
            expect(result.toNumber()).to.equal(outputNotes.length);
        });

        it('should return a correct bytes proof output from a proof outputs array', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const result = await noteUtils.get(proof.eth.outputs, 0);
            expect(result).to.equal(proof.eth.output.toLowerCase());
        });

        it('should return a correct bytes note from a notes array', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const encodedOutputNotes = outputCoder.getOutputNotes(proof.output);
            const encodedOutputNote = outputCoder.getNote(encodedOutputNotes, 0);
            const formattedOutputNote = `0x${encodedOutputNote.slice(0x40)}`;
            const formattedOutputNotes = `0x${encodedOutputNotes.slice(0x40)}`;
            const result = await noteUtils.get(formattedOutputNotes, 0);
            expect(result).to.equal(formattedOutputNote.toLowerCase());
        });

        it('should extract the proof output components', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const encodedInputNotes = outputCoder.getInputNotes(proof.output);
            const encodedOutputNotes = outputCoder.getOutputNotes(proof.output);

            const result = await noteUtils.extractProofOutput(proof.eth.output);
            const formattedInputNotes = `0x${encodedInputNotes.slice(0x40)}`;
            expect(result.inputNotes).to.equal(formattedInputNotes.toLowerCase());
            const formattedOutputNotes = `0x${encodedOutputNotes.slice(0x40)}`;
            expect(result.outputNotes).to.equal(formattedOutputNotes.toLowerCase());

            const proofOutput = outputCoder.decodeProofOutput(proof.output);
            expect(result.publicOwner.toLowerCase()).to.equal(proofOutput.publicOwner.toLowerCase());
            expect(result.publicValue.toNumber()).to.equal(proofOutput.publicValue);
        });

        it('should extract the note components', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const encodedOutputNotes = outputCoder.getOutputNotes(proof.output);
            const testNote = outputCoder.getNote(encodedOutputNotes, 0);
            // eslint-disable-next-line no-unused-vars
            const { owner, noteHash } = outputCoder.decodeNote(testNote);
            const metadata = outputCoder.getMetadata(testNote);
            const formattedMetadata = `0x${metadata}`;
            const formattedTestNote = `0x${testNote.slice(0x40)}`;
            const result = await noteUtils.extractNote(formattedTestNote);
            expect(result.owner.toLowerCase()).to.equal(owner.toLowerCase());
            expect(result.noteHash).to.equal(noteHash);
            expect(result.metadata).to.equal(formattedMetadata);
        });

        it('should extract the correct note type', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const encodedOutputNotes = outputCoder.getOutputNotes(proof.output);
            const testNote = outputCoder.getNote(encodedOutputNotes, 0);
            const { noteType } = outputCoder.decodeNote(testNote);
            const formattedTestNote = `0x${testNote.slice(0x40)}`;
            const result = await noteUtils.getNoteType(formattedTestNote);
            expect(result.toNumber()).to.equal(noteType);
        });

        it('should correctly encode public owner as an address', async () => {
            const bogusPublicOwner = '0x1111222233334444';
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            proof.publicOwner = bogusPublicOwner;
            proof.constructOutputs();
            const result = await noteUtils.extractProofOutput(proof.eth.output);
            expect(result.publicOwner.toLowerCase()).to.equal(padLeft(bogusPublicOwner, 40));
        });
    });

    describe('Failure States', async () => {
        it('should fail when index is out of bounds', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            await truffleAssert.reverts(noteUtils.get(proof.eth.outputs, 100), 'AZTEC array index is out of bounds');
        });
    });
});
