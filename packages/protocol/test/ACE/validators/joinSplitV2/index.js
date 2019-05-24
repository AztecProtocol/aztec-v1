/* global artifacts, expect, contract, beforeEach, it:true */
const { abiCoder, JoinSplitProof, note, signer } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { padLeft } = require('web3-utils');

const JoinSplitValidator = artifacts.require('./JoinSplit');
const JoinSplitValidatorInterface = artifacts.require('./JoinSplitInterface');

JoinSplitValidator.abi = JoinSplitValidatorInterface.abi;

contract.only('Join-Split Validator', (accounts) => {
    const aztecAccounts = Array(2)
        .fill()
        .map(() => secp256k1.generateAccount());
    let joinSplitValidator;
    let inputNotes;
    const inputNoteValues = [10, 10];
    // let notes = [];
    const outputNoteValues = [40, 20];
    let outputNotes;
    // const { publicKey } = secp256k1.generateAccount();
    const publicOwner = aztecAccounts[0].address;
    const sender = aztecAccounts[0].address;

    before(async () => {
        // see https://github.com/AztecProtocol/specification#aztec-verifiers-bilateralswapsol
        inputNotes = await Promise.all([
            note.create(aztecAccounts[0].publicKey, inputNoteValues[0]),
            note.create(aztecAccounts[1].publicKey, inputNoteValues[1]),
        ]);
        outputNotes = await Promise.all([
            note.create(aztecAccounts[0].publicKey, outputNoteValues[0]),
            note.create(aztecAccounts[1].publicKey, outputNoteValues[1]),
        ]);
        joinSplitValidator = await JoinSplitValidator.new({ from: accounts[0] });
    });

    describe('Success States', () => {
        it('should validate Join-Split proof', async () => {
            // Negative public value means depositing tokens
            const publicValue = -40;
            const joinSplitProof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            const inputNotePrivateKeys = aztecAccounts.slice(0, 2).map((aztecAccount) => aztecAccount.privateKey);
            const { data } = joinSplitProof.encodeABI(joinSplitValidator.address, inputNotePrivateKeys);
            const result = await joinSplitValidator.validateJoinSplit(data, sender, constants.CRS);

            const decoded = abiCoder.decoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
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
            expect(decoded[0].publicValue).to.equal(-40);

            expect(result).to.equal(joinSplitProof.eth.output);
        });
    });

    describe('Failure States', () => {});
});
