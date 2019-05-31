/* global artifacts, expect, contract, it:true */
const { note, SwapProof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const { mockZeroSwapProof } = require('../../../helpers/proof');

const Swap = artifacts.require('./Swap');
const SwapInterface = artifacts.require('./SwapInterface');
Swap.abi = SwapInterface.abi;

const maker = secp256k1.generateAccount();
let swapValidator;
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

contract.only('Swap Validator', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        swapValidator = await Swap.new({ from: accounts[0] });
    });

    describe('Success States', () => {
        it('should validate Swap proof', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const data = proof.encodeABI();
            const result = await swapValidator.validateSwap(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Swap proof that uses notes worth 0', async () => {
            const asks = [0, 20];
            const bids = [0, 20];
            const { inputNotes, outputNotes } = await getNotes(asks, bids);
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const data = proof.encodeABI();
            const result = await swapValidator.validateSwap(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Swap proof with challenge that has GROUP_MODULUS added to it', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.challenge = proof.challenge.add(constants.GROUP_MODULUS);
            proof.constructOutput();
            const data = proof.encodeABI();
            const result = await swapValidator.validateSwap(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(proof.eth.output);
        });
    });

    describe('Failure States', () => {
        it('should fail if notes do NOT balance (k1 != k3, k2 != k4)', async () => {
            const asks = [10, 50];
            const bids = [20, 20];
            const { inputNotes, outputNotes } = await getNotes(asks, bids);
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if provided 2 notes instead of 4', async () => {
            // We have to first use the correct number of input and output notes and later swap them
            // because otherwise the proof construction fails
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.data = [proof.data[0], proof.data[1]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if provided 3 notes instead of 4', async () => {
            // We have to first use the correct number of input and output notes and later swap them
            // because otherwise the proof construction fails
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.data = [proof.data[0], proof.data[1], proof.data[2]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if malformed proof data', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.data = [];
            for (let i = 0; i < 4; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if points NOT on curve', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const zeroSwapProof = await mockZeroSwapProof();
            proof.data = zeroSwapProof.data;
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if scalars NOT modulo GROUP_MODULUS', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const kBar = new BN(proof.data[0][0].slice(2), 16);
            proof.data[0][0] = `0x${kBar.add(constants.GROUP_MODULUS).toString(16)}`;
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if scalars are 0', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const zeroScalar = padLeft('0x00', 64);
            proof.data[0][0] = zeroScalar;
            proof.data[0][1] = zeroScalar;
            proof.data[1][0] = zeroScalar;
            proof.data[1][1] = zeroScalar;
            proof.data[2][0] = zeroScalar;
            proof.data[2][1] = zeroScalar;
            proof.data[3][0] = zeroScalar;
            proof.data[3][1] = zeroScalar;
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${constants.H_X.toString(16)}`;
            proof.data[0][3] = `0x${constants.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${constants.H_X.toString(16)}`;
            proof.data[0][5] = `0x${constants.H_Y.toString(16)}`;
            proof.challenge = new BN('0a', 16);
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if malformed challenge', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            proof.challenge = new BN('0');
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if sender NOT integrated into challenge variable', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            // First element should have been the sender
            proof.constructChallengeRecurse([proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if notes NOT integrated into challenge variable', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            // Second element should have been the notes
            proof.constructChallengeRecurse([proof.sender, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if blinding factors NOT integrated into challenge variable', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            // Third element should have been the blinding factors
            proof.constructChallengeRecurse([proof.sender, proof.notes]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if malformed H_X, H_Y in CRS', async () => {
            const { inputNotes, outputNotes } = await getDefaultNotes();
            const proof = new SwapProof(inputNotes, outputNotes, sender);
            const data = proof.encodeABI();
            const malformedHx = constants.H_X.add(new BN(1));
            const malformedHy = constants.H_Y.add(new BN(1));
            const bogusCRS = [`0x${malformedHx.toString(16)}`, `0x${malformedHy.toString(16)}`, ...constants.t2];
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, bogusCRS), truffleAssert.ErrorType.REVERT);
        });
    });
});
