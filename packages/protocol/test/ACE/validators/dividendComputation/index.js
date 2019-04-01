/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const aztec = require('aztec.js');
const { proof: { dividendComputation } } = require('aztec.js');
const { constants: { CRS } } = require('@aztec/dev-utils');


// ### Artifacts
const dividend = artifacts.require('./contracts/ACE/validators/dividendComputation/DividendComputation');
const dividendInterface = artifacts.require('./contracts/ACE/validators/dividendComputation/DividendComputationInterface');

dividend.abi = dividendInterface.abi;

contract('Dividend Computation', (accounts) => {
    let dividendContract;
    describe('success states', () => {
        let dividendAccounts = [];
        let notes = [];
        let za;
        let zb;

        beforeEach(async () => {
            dividendContract = await dividend.new({
                from: accounts[0],
            });
            dividendAccounts = [...new Array(3)].map(() => aztec.secp256k1.generateAccount());

            const noteValues = [90, 4, 50];
            za = 100;
            zb = 5;

            notes = [
                ...dividendAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, noteValues[i])),
            ];
        });

        it('successfully validates output coding of AZTEC dividend computation zero-knowledge proof', async () => {
            const inputNotes = notes.slice(0, 1);
            const outputNotes = notes.slice(1, 3);

            const { proofData, expectedOutput } = dividendComputation.encodeDividendComputationTransaction({
                inputNotes,
                outputNotes,
                za,
                zb,
                senderAddress: accounts[0],
            });

            const publicOwner = '0x0000000000000000000000000000000000000000';

            const result = await dividendContract.validateDividendComputation(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });

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
            expect(result).to.equal(expectedOutput);

            const gasUsed = await dividendContract.validateDividendComputation.estimateGas(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });
    });
});
