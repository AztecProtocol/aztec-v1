/* global artifacts, expect, contract, beforeEach, it:true */
// ### External Dependencies
const { padLeft } = require('web3-utils');

// ### Internal Dependencies
const aztec = require('aztec.js');
const { proof: { bilateralSwap } } = require('aztec.js');
const { constants: { CRS } } = require('@aztec/dev-utils');

// ### Artifacts
const BilateralSwap = artifacts.require('contracts/ACE/validators/bilateralSwap/BilateralSwap');
const BilateralSwapInterface = artifacts.require('contracts/ACE/validators/bilateralSwap/BilateralSwapInterface');

BilateralSwap.abi = BilateralSwapInterface.abi;


function encodeBilateralSwapTransaction({
    inputNotes,
    outputNotes,
    senderAddress,
}) {
    const {
        proofData: proofDataRaw,
        challenge,
    } = bilateralSwap.constructBilateralSwap([...inputNotes, ...outputNotes], senderAddress);
    const inputOwners = inputNotes.map(m => m.owner);
    const outputOwners = outputNotes.map(n => n.owner);

    const proofData = aztec.abiEncoder.inputCoder.bilateralSwap(
        proofDataRaw,
        challenge,
        inputOwners,
        outputOwners,
        outputNotes
    );

    const publicOwner = '0x0000000000000000000000000000000000000000';
    const publicValue = 0;

    const expectedOutput = `0x${aztec.abiEncoder.outputCoder.encodeProofOutputs([{
        inputNotes,
        outputNotes,
        publicOwner,
        publicValue,
    }]).slice(0x42)}`;
    return { proofData, expectedOutput };
}

contract('Bilateral Swap', (accounts) => {
    let bilateralSwapContract;
    describe('success states', () => {
        let bilateralSwapAccounts = [];
        let notes = [];

        beforeEach(async () => {
            bilateralSwapContract = await BilateralSwap.new({
                from: accounts[0],
            });

            const noteValues = [10, 20, 10, 20];

            bilateralSwapAccounts = [...new Array(4)].map(() => aztec.secp256k1.generateAccount());
            notes = [
                ...bilateralSwapAccounts.map(({ publicKey }, i) => aztec.note.create(publicKey, noteValues[i])),
            ];
        });

        it('successfully validate output encoding for bilateral proof in zero-knowledge', async () => {
            const inputNotes = notes.slice(0, 2);
            const outputNotes = notes.slice(2, 4);
            const { proofData, expectedOutput } = encodeBilateralSwapTransaction({
                inputNotes,
                outputNotes,
                senderAddress: accounts[0],
            });

            const result = await bilateralSwapContract.validateBilateralSwap(proofData, accounts[0], CRS, {
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
            expect(decoded[0].inputNotes[1].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[1].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[1].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[0].inputNotes[1].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(result).to.equal(expectedOutput);

            const gasUsed = await bilateralSwapContract.validateBilateralSwap.estimateGas(proofData, accounts[0], CRS, {
                from: accounts[0],
                gas: 4000000,
            });
            console.log('gas used = ', gasUsed);
        });
    });
});
