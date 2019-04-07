
/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const BN = require('bn.js');
const { padLeft, sha3 } = require('web3-utils');
const truffleAssert = require('truffle-assertions');

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
            } = aztec.proof.bilateralSwap.constructProof([...inputNotes, ...outputNotes], accounts[0]);

            const inputOwners = inputNotes.map(m => m.owner);
            const outputOwners = outputNotes.map(n => n.owner);

            const data = aztec.abiEncoder.inputCoder.bilateralSwap(
                proofData,
                challenge,
                [...inputOwners, ...outputOwners],
                [outputNotes[0], inputNotes[1]]
            );

            const result = await bilateralSwapAbiEncoder.validateBilateralSwap(data, senderAddress, CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            const expected = aztec.abiEncoder.outputCoder.encodeProofOutputs([
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
                    challenge: `0x${padLeft(sha3(challenge).slice(2), 64)}`,
                },
            ]);

            const decoded = aztec.abiEncoder.outputCoder.decodeProofOutputs(
                `0x${padLeft('0', 64)}${result.slice(2)}`
            );
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
            expect(decoded[1].challenge).to.equal(`0x${padLeft(sha3(challenge).slice(2), 64)}`);
            expect(decoded[1].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[1].publicValue).to.equal(0);
            expect(result.slice(2)).to.equal(expected.slice(0x42));
            expect(result.slice(2).length / 2).to.equal(parseInt(expected.slice(0x02, 0x42), 16));
        });
    });

    describe('failure states', () => {
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

        it('will REVERT if number of metadata entries != 2', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const {
                proofData,
                challenge,
            } = aztec.proof.bilateralSwap.constructProof([...inputNotes, ...outputNotes], accounts[0]);

            const inputOwners = inputNotes.map(m => m.owner);
            const outputOwners = outputNotes.map(n => n.owner);

            const data = aztec.abiEncoder.inputCoder.bilateralSwap(
                proofData,
                challenge,
                [...inputOwners, ...outputOwners],
                [outputNotes[0], outputNotes[1], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapAbiEncoder.validateBilateralSwap(data, senderAddress, CRS));
        });


        it('will REVERT if number of outputOwner entries != 4', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const senderAddress = accounts[0];
            const {
                proofData,
                challenge,
            } = aztec.proof.bilateralSwap.constructProof([...inputNotes, ...outputNotes], accounts[0]);

            const inputOwners = inputNotes.map(m => m.owner);
            const outputOwners = outputNotes.map(n => n.owner);

            const data = aztec.abiEncoder.inputCoder.bilateralSwap(
                proofData,
                challenge,
                [...inputOwners, ...outputOwners, ...outputOwners],
                [outputNotes[0], inputNotes[1]]
            );

            await truffleAssert.reverts(bilateralSwapAbiEncoder.validateBilateralSwap(data, senderAddress, CRS));
        });
    });
});
