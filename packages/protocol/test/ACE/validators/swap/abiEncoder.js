/* global artifacts, contract, expect */
const { encoder, note, SwapProof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const sinon = require('sinon');
const truffleAssert = require('truffle-assertions');
const { keccak256, padLeft } = require('web3-utils');

const SwapABIEncoderTest = artifacts.require('./SwapABIEncoderTest');

const maker = secp256k1.generateAccount();
const publicOwner = constants.addresses.ZERO_ADDRESS;
const publicValue = 0;
let swapAbiEncoderTest;
const taker = secp256k1.generateAccount();

const getNotes = async (asks = [], bids = []) => {
    const inputNotes = [];
    if (typeof bids[0] !== 'undefined') {
        inputNotes.push(await note.create(maker.publicKey, bids[0]));
    }
    if (typeof bids[1] !== 'undefined') {
        inputNotes.push(await note.create(taker.publicKey, bids[1]));
    }
    const outputNotes = [];
    if (typeof asks[0] !== 'undefined') {
        outputNotes.push(await note.create(maker.publicKey, asks[0]));
    }
    if (typeof asks[1] !== 'undefined') {
        outputNotes.push(await note.create(taker.publicKey, asks[1]));
    }
    return { inputNotes, outputNotes };
};

const getDefaultNotes = async () => {
    const asks = [10, 20];
    const bids = [10, 20];
    return getNotes(asks, bids);
};

contract.only('Swap Validator ABI Encoder', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        swapAbiEncoderTest = await SwapABIEncoderTest.new({ from: sender });
    });

    describe('Success States', () => {
        it('should encode the output of a Swap proof', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const data = proof.encodeABI();

            const result = await swapAbiEncoderTest.validateSwap(data, sender, constants.CRS, { from: sender });
            const decoded = encoder.outputCoder.decodeProofOutputs(`0x${padLeft('0', 64)}${result.slice(2)}`);
            expect(result).to.equal(proof.eth.output);

            expect(decoded[0].inputNotes[0].gamma.eq(inputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].inputNotes[0].sigma.eq(inputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].inputNotes[0].noteHash).to.equal(inputNotes[0].noteHash);
            expect(decoded[0].inputNotes[0].owner).to.equal(inputNotes[0].owner.toLowerCase());

            expect(decoded[0].outputNotes[0].gamma.eq(outputNotes[0].gamma)).to.equal(true);
            expect(decoded[0].outputNotes[0].sigma.eq(outputNotes[0].sigma)).to.equal(true);
            expect(decoded[0].outputNotes[0].noteHash).to.equal(outputNotes[0].noteHash);
            expect(decoded[0].outputNotes[0].owner).to.equal(outputNotes[0].owner.toLowerCase());

            expect(decoded[0].publicValue).to.equal(publicValue);
            expect(decoded[0].publicOwner).to.equal(publicOwner);
            expect(decoded[0].challenge).to.equal(proof.challengeHex);

            expect(decoded[1].inputNotes[0].gamma.eq(outputNotes[1].gamma)).to.equal(true);
            expect(decoded[1].inputNotes[0].sigma.eq(outputNotes[1].sigma)).to.equal(true);
            expect(decoded[1].inputNotes[0].noteHash).to.equal(outputNotes[1].noteHash);
            expect(decoded[1].inputNotes[0].owner).to.equal(outputNotes[1].owner.toLowerCase());

            expect(decoded[1].outputNotes[0].gamma.eq(inputNotes[1].gamma)).to.equal(true);
            expect(decoded[1].outputNotes[0].sigma.eq(inputNotes[1].sigma)).to.equal(true);
            expect(decoded[1].outputNotes[0].noteHash).to.equal(inputNotes[1].noteHash);
            expect(decoded[1].outputNotes[0].owner).to.equal(inputNotes[1].owner.toLowerCase());

            expect(decoded[1].publicValue).to.equal(publicValue);
            expect(decoded[1].publicOwner).to.equal(publicOwner);
            expect(decoded[1].challenge).to.equal(keccak256(proof.challengeHex));
        });
    });

    describe('Failure States', () => {
        it('should revert if number of output note owners != 4', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            // See https://stackoverflow.com/questions/28569962/stubbing-a-get-method-using-sinon
            sinon.stub(proof, 'outputNoteOwners').value([...proof.outputNoteOwners, ...proof.outputNoteOwners]);
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapAbiEncoderTest.validateSwap(data, sender, constants.CRS));
        });

        it('should revert if number of metadata entries != 2', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender, [outputNotes[0], outputNotes[1], inputNotes[1]]);
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapAbiEncoderTest.validateSwap(data, sender, constants.CRS));
        });
    });
});
