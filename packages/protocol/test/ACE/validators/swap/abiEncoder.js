/* global artifacts, contract, expect */
const { abiCoder, note, SwapProof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const sinon = require('sinon');
const truffleAssert = require('truffle-assertions');
const { keccak256, padLeft } = require('web3-utils');

const SwapABIEncoderTest = artifacts.require('./SwapABIEncoderTest');

contract('Swap Validator ABI Encoder', (accounts) => {
    const asks = [10, 20];
    const bids = [10, 20];
    let inputNotes = [];
    const maker = secp256k1.generateAccount();
    let outputNotes = [];
    const publicOwner = constants.addresses.ZERO_ADDRESS;
    const sender = accounts[0];
    let swapAbiEncoderTest;
    const taker = secp256k1.generateAccount();

    describe('Success States', () => {
        beforeEach(async () => {
            // see https://github.com/AztecProtocol/specification#aztec-verifiers-bilateralswapsol
            inputNotes = await Promise.all([note.create(maker.publicKey, bids[0]), note.create(taker.publicKey, bids[1])]);
            outputNotes = await Promise.all([note.create(maker.publicKey, asks[0]), note.create(taker.publicKey, asks[1])]);
            swapAbiEncoderTest = await SwapABIEncoderTest.new({ from: sender });
        });

        it('should encode the output of a Swap proof', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            const data = swapProof.encodeABI();
            const result = await swapAbiEncoderTest.validateSwap(data, sender, constants.CRS, { from: sender });

            const decoded = abiCoder.decoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
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

            expect(decoded[0].publicValue).to.equal(0);
            expect(decoded[0].publicOwner).to.equal(publicOwner);
            expect(decoded[0].challenge).to.equal(swapProof.challengeHex);
            expect(decoded[1].publicValue).to.equal(0);
            expect(decoded[1].publicOwner).to.equal(publicOwner);
            expect(decoded[1].challenge).to.equal(keccak256(swapProof.challengeHex));

            expect(result).to.equal(swapProof.eth.output);
            expect(result.length).to.equal(swapProof.eth.output.length);
        });
    });

    describe('Failure States', () => {
        it('should revert if number of metadata entries != 2', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender, [outputNotes[0], outputNotes[1], inputNotes[1]]);
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapAbiEncoderTest.validateSwap(data, sender, constants.CRS));
        });

        it('should revert if number of output note owners != 4', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            sinon.stub(swapProof, 'outputNoteOwners').value([...swapProof.outputNoteOwners, ...swapProof.outputNoteOwners]);
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapAbiEncoderTest.validateSwap(data, sender, constants.CRS));
        });
    });
});
