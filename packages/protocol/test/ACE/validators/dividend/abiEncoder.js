/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const { abiEncoder, note, proof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');

// ### Artifacts
const ABIEncoder = artifacts.require('./DividendComputationABIEncoderTest');

contract('Dividend Computation ABI Encoder', (accounts) => {
    let dividendComputationAbiEncoder;
    let dividendAccounts = [];
    let notes = [];

    describe('Success States', () => {
        let za;
        let zb;

        beforeEach(async () => {
            const noteValues = [90, 4, 50];
            za = 100;
            zb = 5;

            dividendAccounts = [...new Array(3)].map(() => secp256k1.generateAccount());
            notes = await Promise.all(
                dividendAccounts.map(({ publicKey }, i) => {
                    return note.create(publicKey, noteValues[i]);
                }),
            );

            dividendComputationAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('should encode the output of a join-split proof', async () => {
            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];
            const { proofData, challenge } = proof.dividendComputation.constructProof(
                [...inputNotes, ...outputNotes],
                za,
                zb,
                accounts[0],
            );

            const proofDataFormatted = [proofData.slice(0, 6)].concat([proofData.slice(6, 12), proofData.slice(12, 18)]);

            const publicOwner = constants.addresses.ZERO_ADDRESS;

            const inputOwners = inputNotes.map((m) => m.owner);
            const outputOwners = outputNotes.map((n) => n.owner);

            const data = abiEncoder.inputCoder.dividendComputation(
                proofDataFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes,
            );

            const result = await dividendComputationAbiEncoder.validateDividendComputation(data, senderAddress, constants.CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = abiEncoder.outputCoder.encodeProofOutputs([
                {
                    inputNotes,
                    outputNotes,
                    publicOwner,
                    publicValue: 0,
                    challenge,
                },
            ]);

            const decoded = abiEncoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

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

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));
        });
    });
});
