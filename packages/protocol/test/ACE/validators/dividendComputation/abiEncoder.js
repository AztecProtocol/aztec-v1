/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const aztec = require('aztec.js');
const { constants: { CRS } } = require('@aztec/dev-utils');

// ### Artifacts
const ABIEncoder = artifacts.require('./contracts/ACE/validators/dividendComputation/DividendComputationABIEncoderTest');


contract('Dividend Computation ABI Encoder', (accounts) => {
    let DividendComputationAbiEncoder;
    let dividendAccounts = [];
    let notes = [];

    describe('success states', () => {
        let za;
        let zb;

        beforeEach(async () => {
            const noteValues = [90, 4, 50];
            za = 100;
            zb = 5;

            dividendAccounts = [...new Array(3)].map(() => aztec.secp256k1.generateAccount());
            notes = dividendAccounts.map(({ publicKey }, i) => {
                return aztec.note.create(publicKey, noteValues[i]);
            });

            DividendComputationAbiEncoder = await ABIEncoder.new({
                from: accounts[0],
            });
        });

        it('successfully encodes output of a join split proof', async () => {
            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);
            const senderAddress = accounts[0];
            const {
                proofData,
                challenge,
            } = aztec.proof.dividendComputation.constructProof([...inputNotes, ...outputNotes], za, zb, accounts[0]);

            const proofDataFormatted = [proofData.slice(0, 6)].concat([proofData.slice(6, 12), proofData.slice(12, 18)]);

            const publicOwner = '0x0000000000000000000000000000000000000000';

            const inputOwners = inputNotes.map(m => m.owner);
            const outputOwners = outputNotes.map(n => n.owner);

            const data = aztec.abiEncoder.inputCoder.dividendComputation(
                proofDataFormatted,
                challenge,
                za,
                zb,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const result = await DividendComputationAbiEncoder.validateDividendComputation(data, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = aztec.abiEncoder.outputCoder.encodeProofOutputs([{
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue: 0,
                challenge,
            }]);

            const decoded = aztec.abiEncoder.outputCoder.decodeProofOutputs(
                `0x${padLeft('0', 64)}${result.slice(2)}`
            );

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
