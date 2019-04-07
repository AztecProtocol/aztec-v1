/* eslint-disable object-curly-newline */
/* global artifacts, contract, describe, expect, it: true */
const { abiEncoder, note, proof, secp256k1 } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const truffleAssert = require('truffle-assertions');
const { padLeft } = require('web3-utils');

const NoteUtils = artifacts.require('./NoteUtilsTest');

const { outputCoder } = abiEncoder;

contract('NoteUtils', async (accounts) => {
    const aztecAccounts = [];
    const aztecNotes = [];
    const bogusPublicOwner = '0x1111222233334444';
    let inputNotes = [];
    let noteUtils;
    let outputNotes = [];
    const proofs = [];
    const proofOutputs = [];
    const tokensTransferred = 50;

    before(async () => {
        noteUtils = await NoteUtils.new();
        aztecAccounts[0] = secp256k1.generateAccount();
        aztecNotes[0] = note.create(aztecAccounts[0].publicKey, tokensTransferred);
        proofs[0] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: [],
            outputNotes: [aztecNotes[0]],
            senderAddress: accounts[0],
            inputNoteOwners: [],
            publicOwner: accounts[0],
            kPublic: -tokensTransferred,
            validatorAddress: constants.addresses.ZERO_ADDRESS,
        });
        proofs[1] = proof.joinSplit.encodeJoinSplitTransaction({
            inputNotes: [],
            outputNotes: [aztecNotes[0]],
            senderAddress: accounts[0],
            inputNoteOwners: [],
            publicOwner: bogusPublicOwner,
            kPublic: -tokensTransferred,
            validatorAddress: constants.addresses.ZERO_ADDRESS,
        });
        proofOutputs[0] = outputCoder.getProofOutput(proofs[0].expectedOutput, 0);
        inputNotes = outputCoder.getInputNotes(proofOutputs[0]);
        outputNotes = outputCoder.getOutputNotes(proofOutputs[0]);
    });

    describe('success states', async () => {
        it('should return the correct length of the abi encoded proof outputs array', async () => {
            const result = await noteUtils.getLength(proofs[0].expectedOutput);
            expect(result.toNumber()).to.equal(1);
        });

        it('should return the correct length of the abi encoded notes array', async () => {
            const formattedOutputNotes = `0x${outputNotes.slice(0x40)}`;
            const result = await noteUtils.getLength(formattedOutputNotes);
            // there's always only one proof output in the arary in the case of join splits
            expect(result.toNumber()).to.equal(1);
        });

        it('should return a correct bytes proof output from a proof outputs array', async () => {
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            const result = await noteUtils.get(proofs[0].expectedOutput, 0);
            expect(result).to.equal(formattedProofOutput);
        });

        it('should return a correct bytes note from a notes array', async () => {
            const testNote = outputCoder.getNote(outputNotes, 0);
            const formattedTestNote = `0x${testNote.slice(0x40)}`;
            const formattedOutputNotes = `0x${outputNotes.slice(0x40)}`;
            const result = await noteUtils.get(formattedOutputNotes, 0);
            expect(result).to.equal(formattedTestNote);
        });

        it('should extract the proof output components', async () => {
            const proofOutput = outputCoder.decodeProofOutput(proofOutputs[0]);
            const formattedProofOutput = `0x${proofOutputs[0].slice(0x40)}`;
            const result = await noteUtils.extractProofOutput(formattedProofOutput);
            const formattedInputNotes = `0x${inputNotes.slice(0x40)}`;
            expect(result.inputNotes).to.equal(formattedInputNotes);
            const formattedOutputNotes = `0x${outputNotes.slice(0x40)}`;
            expect(result.outputNotes).to.equal(formattedOutputNotes);
            expect(result.publicOwner.toLowerCase()).to.equal(proofOutput.publicOwner);
            expect(result.publicValue.toNumber()).to.equal(proofOutput.publicValue);
        });

        it('should extract the note components', async () => {
            const testNote = outputCoder.getNote(outputNotes, 0);
            // eslint-disable-next-line no-unused-vars
            const { owner, noteHash } = outputCoder.decodeNote(testNote);
            const metadata = outputCoder.getMetadata(testNote);
            const formattedMetadata = `0x${metadata}`;
            const formattedTestNote = `0x${testNote.slice(0x40)}`;
            const result = await noteUtils.extractNote(formattedTestNote);
            expect(result.owner.toLowerCase()).to.equal(owner);
            expect(result.noteHash).to.equal(noteHash);
            expect(result.metadata).to.equal(formattedMetadata);
        });

        it('should extract the correct note type', async () => {
            const testNote = outputCoder.getNote(outputNotes, 0);
            const { noteType } = outputCoder.decodeNote(testNote);
            const formattedTestNote = `0x${testNote.slice(0x40)}`;
            const result = await noteUtils.getNoteType(formattedTestNote);
            expect(result.toNumber()).to.equal(noteType);
        });

        it('should correctly encode public owner as an address', async () => {
            proofOutputs[1] = outputCoder.getProofOutput(proofs[1].expectedOutput, 0);
            const formattedProofOutput = `0x${proofOutputs[1].slice(0x40)}`;
            const result = await noteUtils.extractProofOutput(formattedProofOutput);
            expect(result.publicOwner.toLowerCase()).to.equal(padLeft(bogusPublicOwner, 40));
        });
    });

    describe('failure states', async () => {
        it('should fail when index is out of bounds', async () => {
            await truffleAssert.reverts(
                noteUtils.get(proofs[0].expectedOutput, 100),
                'AZTEC array index is out of bounds'
            );
        });
    });
});
