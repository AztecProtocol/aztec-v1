/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const { abiEncoder, note, proof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

const { burn } = proof;
const { outputCoder } = abiEncoder;

// ### Artifacts
const ABIEncoder = artifacts.require('./AdjustSupplyABIEncoderTest');

contract('AdjustSupply ABI Encoder on a Burn Proof', (accounts) => {
    let adjustSupplyAbiEncoder;

    describe('Success States', () => {
        beforeEach(async () => {
            adjustSupplyAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('should encode output of a burn proof', async () => {
            const numNotes = 4;
            const noteValues = [50, 30, 10, 10];
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = await Promise.all(
                aztecAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            const newTotalBurned = notes[0];
            const oldTotalBurned = notes[1];
            const adjustedNotes = notes.slice(2, 4);

            const publicOwner = constants.addresses.ZERO_ADDRESS;
            const publicValue = 0;

            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = burn.encodeBurnTransaction({
                newTotalBurned,
                oldTotalBurned,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const result = await adjustSupplyAbiEncoder.validateAdjustSupply(proofData, senderAddress, constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

            // First proofOutput object (1 input note, 1 output note)
            expect(decoded[0].outputNotes[0].gamma.eq(newTotalBurned.gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(newTotalBurned.sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(newTotalBurned.noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(newTotalBurned.owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(oldTotalBurned.gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(oldTotalBurned.sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(oldTotalBurned.noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(oldTotalBurned.owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(publicValue);

            // Second proofOutput object (there are 2 notes being burned)
            expect(decoded[1].outputNotes[0].gamma.eq(adjustedNotes[0].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[0].sigma.eq(adjustedNotes[0].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[0].noteHash).to.equal(adjustedNotes[0].noteHash);
            expect(decoded[1].outputNotes[0].owner).to.equal(adjustedNotes[0].owner.toLowerCase());

            expect(decoded[1].outputNotes[1].gamma.eq(adjustedNotes[1].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[1].sigma.eq(adjustedNotes[1].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[1].noteHash).to.equal(adjustedNotes[1].noteHash);
            expect(decoded[1].outputNotes[1].owner).to.equal(adjustedNotes[1].owner.toLowerCase());

            expect(decoded[1].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[1].publicValue).to.equal(publicValue);
            expect(result).to.equal(expectedOutput);
        });
    });
});
