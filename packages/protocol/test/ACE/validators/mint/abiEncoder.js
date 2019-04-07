/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const {
    abiEncoder: { outputCoder },
    secp256k1,
    note,
    proof: { mint },
} = require('aztec.js');
const {
    constants: { CRS },
} = require('@aztec/dev-utils');
const { padLeft } = require('web3-utils');

// ### Artifacts
const ABIEncoder = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupplyABIEncoderTest');

contract('AdjustSupply ABI Encoder on a mint proof', (accounts) => {
    let adjustSupplyAbiEncoder;

    describe('success states', () => {
        beforeEach(async () => {
            adjustSupplyAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('successfully encodes output of a mint proof', async () => {
            const numNotes = 4;
            const noteValues = [50, 30, 10, 10];
            const aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const newTotalMinted = notes[0];
            const oldTotalMinted = notes[1];
            const adjustedNotes = notes.slice(2, 4);

            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;

            const senderAddress = accounts[0];

            const { proofData, expectedOutput } = mint.encodeMintTransaction({
                newTotalMinted,
                oldTotalMinted,
                adjustedNotes,
                senderAddress: accounts[0],
            });

            const result = await adjustSupplyAbiEncoder.validateAdjustSupply(proofData, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

            expect(decoded[0].inputNotes[0].gamma.eq(oldTotalMinted.gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(oldTotalMinted.sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(oldTotalMinted.noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(oldTotalMinted.owner.toLowerCase());

            // First proofOutput object (1 input note, 1 output note)
            expect(decoded[0].outputNotes[0].gamma.eq(newTotalMinted.gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(newTotalMinted.sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(newTotalMinted.noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(newTotalMinted.owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(publicValue);

            // Second proofOutput object (there are 2 notes being minted)
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
