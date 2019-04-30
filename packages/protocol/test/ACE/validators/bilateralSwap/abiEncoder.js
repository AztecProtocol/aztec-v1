/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { keccak256, padLeft } = require('web3-utils');

// ### Internal Dependencies
const { abiEncoder, note, proof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

// ### Artifacts
const ABIEncoder = artifacts.require('./BilateralSwapABIEncoderTest');

contract('Bilateral Swap ABI Encoder', (accounts) => {
    let bilateralSwapAbiEncoder;
    let bilateralSwapAccounts = [];
    let notes = [];

    describe('Success States', () => {
        beforeEach(async () => {
            const noteValues = [10, 20, 10, 20];
            bilateralSwapAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            notes = await Promise.all([
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ]);
            bilateralSwapAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('should encode the output of a bilateral swap zero knowledge proof', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const publicOwner = constants.addresses.ZERO_ADDRESS;
            const publicValue = new BN(0);
            const { proofData, challenge } = proof.bilateralSwap.constructProof([...inputNotes, ...outputNotes], accounts[0]);

            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const data = abiEncoder.inputCoder.bilateralSwap(
                proofData,
                challenge,
                [...inputOwners, ...outputOwners],
                [outputNotes[0], inputNotes[1]],
            );

            const result = await bilateralSwapAbiEncoder.validateBilateralSwap(data, senderAddress, constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = abiEncoder.outputCoder.encodeProofOutputs([
                {
                    inputNotes: [inputNotes[0]],
                    outputNotes: [outputNotes[0]],
                    publicOwner,
                    publicValue,
                    challenge,
                },
                {
                    inputNotes: [outputNotes[1]],
                    outputNotes: [inputNotes[1]],
                    publicOwner,
                    publicValue,
                    challenge: `0x${padLeft(keccak256(challenge).slice(2), 64)}`,
                },
            ]);

            const decoded = abiEncoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());
            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());

            expect(decoded[1].inputNotes[0].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[1].inputNotes[0].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[1].inputNotes[0].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[1].inputNotes[0].owner).to.equal(outputNotes[1].owner.toLowerCase());
            expect(decoded[1].outputNotes[0].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[0].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[0].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[1].outputNotes[0].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(decoded[0].challenge).to.equal(challenge);
            expect(decoded[1].challenge).to.equal(`0x${padLeft(keccak256(challenge).slice(2), 64)}`);
            expect(decoded[1].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[1].publicValue).to.equal(0);
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));
        });
    });

    describe('Failure States', () => {
        beforeEach(async () => {
            const noteValues = [10, 20, 10, 20];
            bilateralSwapAccounts = [...new Array(4)].map(() => secp256k1.generateAccount());
            notes = await Promise.all([
                ...bilateralSwapAccounts.map(({ publicKey }, i) => note.create(publicKey, noteValues[i])),
            ]);
            bilateralSwapAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('should REVERT if number of metadata entries != 2', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const { proofData, challenge } = proof.bilateralSwap.constructProof([...inputNotes, ...outputNotes], accounts[0]);

            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const data = abiEncoder.inputCoder.bilateralSwap(
                proofData,
                challenge,
                [...inputOwners, ...outputOwners],
                [outputNotes[0], outputNotes[1], inputNotes[1]],
            );

            await truffleAssert.reverts(bilateralSwapAbiEncoder.validateBilateralSwap(data, senderAddress, constants.CRS));
        });

        it('should REVERT if number of outputOwner entries != 4', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const { proofData, challenge } = proof.bilateralSwap.constructProof([...inputNotes, ...outputNotes], accounts[0]);

            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const data = abiEncoder.inputCoder.bilateralSwap(
                proofData,
                challenge,
                [...inputOwners, ...outputOwners, ...outputOwners],
                [outputNotes[0], inputNotes[1]],
            );

            await truffleAssert.reverts(bilateralSwapAbiEncoder.validateBilateralSwap(data, senderAddress, constants.CRS));
        });
    });
});
