/* global artifacts, expect, contract, beforeEach, it:true */
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

contract.only('Swap Validator', (accounts) => {
    const asks = [10, 20];
    const bids = [10, 20];
    let inputNotes = [];
    const maker = secp256k1.generateAccount();
    let outputNotes = [];
    const sender = accounts[0];
    let swapValidator;
    const taker = secp256k1.generateAccount();

    beforeEach(async () => {
        // see https://github.com/AztecProtocol/specification#aztec-verifiers-bilateralswapsol
        inputNotes = await Promise.all([note.create(maker.publicKey, bids[0]), note.create(taker.publicKey, bids[1])]);
        outputNotes = await Promise.all([note.create(maker.publicKey, asks[0]), note.create(taker.publicKey, asks[1])]);
        swapValidator = await Swap.new({ from: accounts[0] });
    });

    describe('Success States', () => {
        it('should validate Swap proof', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender, [outputNotes[0], inputNotes[1]]);
            const data = swapProof.encodeABI();

            const result = await swapValidator.validateSwap(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(swapProof.eth.output);
        });

        it('should validate Swap proof that uses notes worth 0', async () => {
            const testAsks = [0, 20];
            const testBids = [0, 20];
            const testInputNotes = await Promise.all([
                note.create(maker.publicKey, testBids[0]),
                note.create(taker.publicKey, testBids[1]),
            ]);
            const testOutputNotes = await Promise.all([
                note.create(maker.publicKey, testAsks[0]),
                note.create(taker.publicKey, testAsks[1]),
            ]);
            const swapProof = new SwapProof(testInputNotes, testOutputNotes, sender);
            const data = swapProof.encodeABI();
            const result = await swapValidator.validateSwap(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(swapProof.eth.output);
        });

        it('should validate that challenge has GROUP_MODULUS added to it', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            swapProof.challenge = swapProof.challenge.add(constants.GROUP_MODULUS);
            swapProof.constructOutput();
            const data = swapProof.encodeABI();
            const result = await swapValidator.validateSwap(data, sender, constants.CRS, { from: sender });
            expect(result).to.equal(swapProof.eth.output);
        });
    });

    describe('Failure States', () => {
        it('should fail if notes do NOT balance (k1 != k3, k2 != k4)', async () => {
            const testAsks = [10, 50];
            const testBids = [20, 20];
            const testInputNotes = await Promise.all([
                note.create(maker.publicKey, testBids[0]),
                note.create(taker.publicKey, testBids[1]),
            ]);
            const testOutputNotes = await Promise.all([
                note.create(maker.publicKey, testAsks[0]),
                note.create(taker.publicKey, testAsks[1]),
            ]);
            const swapProof = new SwapProof(testInputNotes, testOutputNotes, sender);
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if using 2 notes instead of 4', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            const testAsks = [20];
            const testBids = [20];
            const testInputNotes = await Promise.all([note.create(maker.publicKey, testBids[0])]);
            const testOutputNotes = await Promise.all([note.create(maker.publicKey, testAsks[0])]);
            swapProof.inputNotes = testInputNotes;
            swapProof.outputNotes = testOutputNotes;
            swapProof.notes = [...testInputNotes, ...testOutputNotes];
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if using 3 notes instead of 4', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            const testAsks = [10, 20];
            const testBids = [20];
            const testInputNotes = await Promise.all([note.create(maker.publicKey, testBids[0])]);
            const testOutputNotes = await Promise.all([note.create(maker.publicKey, testAsks[0])]);
            swapProof.inputNotes = testInputNotes;
            swapProof.outputNotes = testOutputNotes;
            swapProof.notes = [...testInputNotes, ...testOutputNotes];
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if malformed proof data', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            swapProof.data = Array(4)
                .fill()
                .map(() => {
                    return Array(6)
                        .fill()
                        .map(() => {
                            return randomHex(32);
                        });
                });
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if points NOT on curve', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            const zeroSwapProof = await mockZeroSwapProof();
            swapProof.data = zeroSwapProof.data;
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if scalars NOT modulo GROUP_MODULUS', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            const kBar = new BN(swapProof.data[0][0].slice(2), 16);
            const notModKBar = `0x${kBar.add(constants.GROUP_MODULUS).toString(16)}`;
            swapProof.data[0][0] = notModKBar;
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if scalars are zero', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            const zeroScalar = padLeft('0', 64);
            swapProof.data[0][0] = zeroScalar;
            swapProof.data[0][1] = zeroScalar;
            swapProof.data[1][0] = zeroScalar;
            swapProof.data[1][1] = zeroScalar;
            swapProof.data[2][0] = zeroScalar;
            swapProof.data[2][1] = zeroScalar;
            swapProof.data[3][0] = zeroScalar;
            swapProof.data[3][1] = zeroScalar;
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            swapProof.data[0][0] = padLeft('0x05', 64);
            swapProof.data[0][1] = padLeft('0x05', 64);
            swapProof.data[0][2] = `0x${constants.H_X.toString(16)}`;
            swapProof.data[0][3] = `0x${constants.H_Y.toString(16)}`;
            swapProof.data[0][4] = `0x${constants.H_X.toString(16)}`;
            swapProof.data[0][5] = `0x${constants.H_Y.toString(16)}`;
            swapProof.challenge = new BN('0a', 16);
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if malformed challenge', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            swapProof.challenge = new BN(randomHex(32).slice(2), 16);
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if sender NOT integrated into challenge variable', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            swapProof.constructChallengeRecurse([[...inputNotes, ...outputNotes], swapProof.blindingFactors]);
            swapProof.challenge = swapProof.challengeHash.redKeccak();
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if notes NOT integrated into challenge variable', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            swapProof.constructChallengeRecurse([sender, swapProof.blindingFactors]);
            swapProof.challenge = swapProof.challengeHash.redKeccak();
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if blinding factors NOT integrated into challenge variable', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            swapProof.constructChallengeRecurse([sender, [...inputNotes, ...outputNotes]]);
            swapProof.challenge = swapProof.challengeHash.redKeccak();
            const data = swapProof.encodeABI();
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, constants.CRS), truffleAssert.ErrorType.REVERT);
        });

        it('should fail if incorrect H_X, H_Y in CRS)', async () => {
            const swapProof = new SwapProof(inputNotes, outputNotes, sender);
            const data = swapProof.encodeABI();
            const bogusHx = constants.H_X.add(new BN(1));
            const bogusHy = constants.H_Y.add(new BN(1));
            const bogusCRS = [`0x${bogusHx.toString(16)}`, `0x${bogusHy.toString(16)}`, ...constants.t2];
            await truffleAssert.reverts(swapValidator.validateSwap(data, sender, bogusCRS), truffleAssert.ErrorType.REVERT);
        });
    });
});
