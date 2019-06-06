/* global artifacts, expect, contract, beforeEach, it:true */
const { encoder, note, JoinSplitProof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const { padLeft } = require('web3-utils');

const JoinSplitABIEncoderTest = artifacts.require('./JoinSplitABIEncoderTest');

const aztecAccount = secp256k1.generateAccount();
const aztecAccountMapping = {
    [aztecAccount.address]: aztecAccount.privateKey,
};
let joinSplitAbiEncoderTest;

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
    const outputNoteValues = [10, 10];
    const publicValue = 0;
    const { inputNotes, outputNotes } = await getNotes(inputNoteValues, outputNoteValues);
    return { inputNotes, outputNotes, publicValue };
};

contract.only('Join-Split ABI Encoder', (accounts) => {
    const publicOwner = accounts[0];
    const sender = accounts[0];

    // Creating a collection of tests that should pass
    describe('Success States', () => {
        beforeEach(async () => {
            joinSplitAbiEncoderTest = await JoinSplitABIEncoderTest.new({ from: sender });
        });

        it('should encode output of a Join-Split proof', async () => {
            const { inputNotes, outputNotes, publicValue } = await getDefaultNotes();
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            // TODO: although signatures will be removed from the validator logic anyway, this is a code smell.
            // The address put in the signature should not be the test contract's address, but rather the validator itself.
            const data = proof.encodeABI(joinSplitAbiEncoderTest.address, aztecAccountMapping);

            const result = await joinSplitAbiEncoderTest.validateJoinSplit(data, sender, constants.CRS);
            const decoded = encoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            expect(result).to.equal(proof.eth.output);

            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());
            expect(decoded[0].outputNotes[1].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[1].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[1].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[0].outputNotes[1].owner).to.equal(outputNotes[1].owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());
            expect(decoded[0].inputNotes[1].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[1].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[1].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[0].inputNotes[1].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(decoded[0].challenge).to.equal(proof.challengeHex);
        });
    });
});
