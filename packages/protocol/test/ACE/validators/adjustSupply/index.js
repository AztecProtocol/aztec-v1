/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const {
    secp256k1,
    note,
    proof: { adjustSupply },
    abiEncoder: { outputCoder },
} = require('aztec.js');

const { constants: { CRS }, exceptions } = require('@aztec/dev-utils');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');


// ### Artifacts
const AdjustSupply = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupply');
const AdjustSupplyInterface = artifacts.require('./contracts/ACE/validators/adjustSupply/AdjustSupply/AdjustSupplyInterface');

AdjustSupply.abi = AdjustSupplyInterface.abi;

contract.only('AdjustSupply', (accounts) => {
    let adjustSupplyContract;
    describe('success states', () => {
        let aztecAccounts = [];

        beforeEach(async () => {
            adjustSupplyContract = await AdjustSupply.new({
                from: accounts[0],
            });
            const numNotes = 4;
            aztecAccounts = [...new Array(numNotes)].map(() => secp256k1.generateAccount());
        });

        it('successfully validates encoding of a adjustSupply proof zero-knowledge proof', async () => {
            const noteValues = [50, 30, 10, 10];
            const notes = aztecAccounts.map(({ publicKey }, i) => {
                return note.create(publicKey, noteValues[i]);
            });

            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 4);
            const publicOwner = '0x0000000000000000000000000000000000000000';
            const publicValue = 0;

            // change interface to
            /*
                {
                    oldSupply,
                    newSupply,
                    adjustedNotes,
                }
            */
            const { proofData, expectedOutput } = adjustSupply.encodeAdjustSupplyTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            const result = await adjustSupplyContract.validateAdjustSupply(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });

            // console.log('result: ', result);
            // process.exit(1);

            const decoded = outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);

            // First proofOutput object (1 input note, 1 output note)
            expect(decoded[0].outputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());

            expect(decoded[0].inputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());

            expect(decoded[0].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[0].publicValue).to.equal(publicValue);

            // Second proofOutput object (there are 3 notes being minted)
            expect(decoded[1].outputNotes[0].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[0].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[0].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[1].outputNotes[0].owner).to.equal(outputNotes[1].owner.toLowerCase());

            expect(decoded[1].outputNotes[1].gamma.eq(outputNotes[2].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[1].sigma.eq(outputNotes[2].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[1].noteHash).to.equal(outputNotes[2].noteHash);
            expect(decoded[1].outputNotes[1].owner).to.equal(outputNotes[2].owner.toLowerCase());

            expect(decoded[1].publicOwner).to.equal(publicOwner.toLowerCase());
            expect(decoded[1].publicValue).to.equal(publicValue);
            expect(result).to.equal(expectedOutput);


            const gasUsed = await adjustSupplyContract.validateAdjustSupply.estimateGas(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });
    });
});
