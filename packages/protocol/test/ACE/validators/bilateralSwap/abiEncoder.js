
/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const aztec = require('aztec.js');
const { constants: { CRS } } = require('@aztec/dev-utils');

// ### Artifacts
const BilateralSwapAbiEncoder = artifacts.require(
    './contracts/ACE/validators/bilateralSwap/BilateralSwapABIEncoderTest'
);


contract('Bilateral ABI Encoder', (accounts) => {
    let bilateralSwapAbiEncoder;
    let bilateralSwapAccounts = [];
    let notes = [];

    describe('success states', () => {
        beforeEach(async () => {
            const noteValues = [10, 20, 10, 20];

            bilateralSwapAccounts = [...new Array(4)].map(() => aztec.secp256k1.generateAccount());

            notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, noteValues[i])),
            ];

            bilateralSwapAbiEncoder = await BilateralSwapAbiEncoder.new({
                from: accounts[0],
            });
        });

        it('successfully encodes output of a bilateral swap zero knowledge proof', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = new BN(0);
            const {
                proofData,
                challenge,
            } = aztec.proof.bilateralSwap.constructBilateralSwap([...inputNotes, ...outputNotes], accounts[0]);

            const inputOwners = inputNotes.map(m => m.owner);
            const outputOwners = outputNotes.map(n => n.owner);

            const data = aztec.abiEncoder.inputCoder.bilateralSwap(
                proofData,
                challenge,
                inputOwners,
                outputOwners,
                outputNotes
            );

            const result = await bilateralSwapAbiEncoder.validateBilateralSwap(data, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = aztec.abiEncoder.outputCoder.encodeProofOutputs([{
                inputNotes,
                outputNotes,
                publicOwner,
                publicValue,
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
            expect(decoded[0].inputNotes[1].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[1].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[1].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[0].inputNotes[1].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(0);
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));

            const gasUsed = await bilateralSwapAbiEncoder.validateBilateralSwap.estimateGas(data, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            console.log('gas used = ', gasUsed);
        });
    });
});
