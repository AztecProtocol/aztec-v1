/* global artifacts, contract, expect, it: true */

const { BurnProof, MintProof, note, Proof } = require('aztec.js');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const sinon = require('sinon');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const { mockZeroJoinSplitFluidProof } = require('../../../helpers/proof');

const JoinSplitFluidValidator = artifacts.require('./JoinSplitFluid');
const JoinSplitFluidValidatorInterface = artifacts.require('./JoinSplitFluidInterface');
JoinSplitFluidValidator.abi = JoinSplitFluidValidatorInterface.abi;

const { publicKey } = secp256k1.generateAccount();

/**
 * The mint proof tests are logically on par with the burn proof tests, which means there's a fair bit of
 * duplication in this test suite. Unfortunately, the alternative is to use an API which is rather ugly.
 *
 * @see https://stackoverflow.com/questions/17144197/running-the-same-mocha-test-multiple-times-with-different-data
 */
const getMintNotes = async (currentMintCounter, newMintCounter, mintedNoteValues) => {
    const currentMintCounterNote = await note.create(publicKey, currentMintCounter);
    const newMintCounterNote = await note.create(publicKey, newMintCounter);
    const mintedNotes = await Promise.all(mintedNoteValues.map((mintedValue) => note.create(publicKey, mintedValue)));
    return { currentMintCounterNote, newMintCounterNote, mintedNotes };
};

const getDefaultMintNotes = async () => {
    const currentMintCounter = 30;
    const newMintCounter = 50;
    const mintedNoteValues = [10, 10];
    return getMintNotes(currentMintCounter, newMintCounter, mintedNoteValues);
};

contract.only('Mint Validator', (accounts) => {
    let joinSplitFluidValidator;
    const sender = accounts[0];

    before(async () => {
        joinSplitFluidValidator = await JoinSplitFluidValidator.new({ from: sender });
    });

    describe('Success States', () => {
        it('should validate Mint proof', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Mint proof with many input and output notes', async () => {
            const currentMintCounter = 30;
            const newMintCounter = 80;
            const mintedNoteValues = [10, 10, 10, 10, 10];
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getMintNotes(
                currentMintCounter,
                newMintCounter,
                mintedNoteValues,
            );
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Mint proof with minted notes of zero value', async () => {
            const currentMintCounter = 30;
            const newMintCounter = 50;
            const mintedNoteValues = [0, 20];
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getMintNotes(
                currentMintCounter,
                newMintCounter,
                mintedNoteValues,
            );
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Mint proof with minimum number of notes (one input, one output)', async () => {
            const currentMintCounter = 50;
            const newMintCounter = 50;
            const mintedNoteValues = [];
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getMintNotes(
                currentMintCounter,
                newMintCounter,
                mintedNoteValues,
            );
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Mint proof with challenge that has GROUP_MODULUS added to it', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            proof.challenge = proof.challenge.add(constants.GROUP_MODULUS);
            proof.constructOutput();
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });
    });

    describe('Failure States', () => {
        let validateInputsStub;

        before(() => {
            validateInputsStub = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {});
        });

        after(() => {
            validateInputsStub.restore();
        });

        it('should fail if notes do NOT balance', async () => {
            const currentMintCounter = 30;
            const newMintCounter = 50;
            const mintedNoteValues = [20, 10];
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getMintNotes(
                currentMintCounter,
                newMintCounter,
                mintedNoteValues,
            );
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 0 notes', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            proof.data = [];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 1 note', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            proof.data = [proof.data[0]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed proof data', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            proof.data = [];
            for (let i = 0; i < 4; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if points NOT on curve', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const zeroMintProof = await mockZeroJoinSplitFluidProof();
            proof.data = zeroMintProof.data;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars NOT mod GROUP_MODULUS', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const kBar = new BN(proof.data[0][0].slice(2), 16);
            proof.data[0][0] = `0x${kBar.add(constants.GROUP_MODULUS).toString(16)}`;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars are 0', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
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
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed challenge', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            proof.challenge = new BN('0');
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if sender NOT integrated into challenge variable', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            // First element should have been the sender
            proof.constructChallengeRecurse([proof.publicValue, proof.m, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if public value NOT integrated into challenge variable', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            // Second element should have been the public value
            proof.constructChallengeRecurse([proof.sender, proof.m, proof.publicOwner, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if m NOT integrated into challenge variable', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            // Third element should have been m
            proof.constructChallengeRecurse([
                proof.sender,
                proof.publicValue,
                proof.publicOwner,
                proof.notes,
                proof.blindingFactors,
            ]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if notes NOT integrated into challenge variable', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            // Fifth element should have been the notes
            proof.constructChallengeRecurse([proof.sender, proof.publicValue, proof.m, proof.publicOwner, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blinding factors NOT integrated into challenge variable', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            // Sixth element should have been the blinding factors
            proof.constructChallengeRecurse([proof.sender, proof.publicValue, proof.m, proof.publicOwner, proof.notes]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed H_X, H_Y in CRS', async () => {
            const { currentMintCounterNote, newMintCounterNote, mintedNotes } = await getDefaultMintNotes();
            const proof = new MintProof(currentMintCounterNote, newMintCounterNote, mintedNotes, sender);
            const data = proof.encodeABI();
            const malformedHx = constants.H_X.add(new BN(1));
            const malformedHy = constants.H_Y.add(new BN(1));
            const malformedCRS = [`0x${malformedHx.toString(16)}`, `0x${malformedHy.toString(16)}`, ...constants.t2];
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, malformedCRS),
                truffleAssert.ErrorType.REVERT,
            );
        });
    });
});

const getBurnNotes = async (currentBurnCounter, newBurnCounter, burnedNoteValues) => {
    const currentBurnCounterNote = await note.create(publicKey, currentBurnCounter);
    const newBurnCounterNote = await note.create(publicKey, newBurnCounter);
    const burnedNotes = await Promise.all(burnedNoteValues.map((burnedValue) => note.create(publicKey, burnedValue)));
    return { currentBurnCounterNote, newBurnCounterNote, burnedNotes };
};

const getDefaultBurnNotes = async () => {
    const currentBurnCounter = 30;
    const newBurnCounter = 50;
    const burnedNoteValues = [10, 10];
    return getBurnNotes(currentBurnCounter, newBurnCounter, burnedNoteValues);
};

contract.only('Burn Validator', (accounts) => {
    let joinSplitFluidValidator;
    const sender = accounts[0];

    before(async () => {
        joinSplitFluidValidator = await JoinSplitFluidValidator.new({ from: sender });
    });

    describe('Success States', () => {
        it('should validate Burn proof', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Burn proof with many input and output notes', async () => {
            const currentBurnCounter = 30;
            const newBurnCounter = 80;
            const burnedNoteValues = [10, 10, 10, 10, 10];
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getBurnNotes(
                currentBurnCounter,
                newBurnCounter,
                burnedNoteValues,
            );
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Burn proof with burned notes of zero value', async () => {
            const currentBurnCounter = 30;
            const newBurnCounter = 50;
            const burnedNoteValues = [0, 20];
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getBurnNotes(
                currentBurnCounter,
                newBurnCounter,
                burnedNoteValues,
            );
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Burn proof with minimum number of notes (one input, one output)', async () => {
            const currentBurnCounter = 50;
            const newBurnCounter = 50;
            const burnedNoteValues = [];
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getBurnNotes(
                currentBurnCounter,
                newBurnCounter,
                burnedNoteValues,
            );
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });

        it('should validate Burn proof with challenge that has GROUP_MODULUS added to it', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            proof.challenge = proof.challenge.add(constants.GROUP_MODULUS);
            proof.constructOutput();
            const data = proof.encodeABI();
            const result = await joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS);
            expect(result).to.equal(proof.eth.output);
        });
    });

    describe('Failure States', () => {
        // let validateInputsStub;

        // before(() => {
        //     validateInputsStub = sinon.stub(Proof.prototype, 'validateInputs').callsFake(() => {});
        // });

        // after(() => {
        //     validateInputsStub.restore();
        // });

        it('should fail if notes do NOT balance', async () => {
            const currentBurnCounter = 30;
            const newBurnCounter = 50;
            const burnedNoteValues = [20, 10];
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getBurnNotes(
                currentBurnCounter,
                newBurnCounter,
                burnedNoteValues,
            );
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 0 notes', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            proof.data = [];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 1 note', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            proof.data = [proof.data[0]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed proof data', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            proof.data = [];
            for (let i = 0; i < 4; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if points NOT on curve', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const zeroMintProof = await mockZeroJoinSplitFluidProof();
            proof.data = zeroMintProof.data;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars NOT mod GROUP_MODULUS', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const kBar = new BN(proof.data[0][0].slice(2), 16);
            proof.data[0][0] = `0x${kBar.add(constants.GROUP_MODULUS).toString(16)}`;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars are 0', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
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
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed challenge', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            proof.challenge = new BN('0');
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if sender NOT integrated into challenge variable', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            // First element should have been the sender
            proof.constructChallengeRecurse([proof.publicValue, proof.m, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if public value NOT integrated into challenge variable', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            // Second element should have been the public value
            proof.constructChallengeRecurse([proof.sender, proof.m, proof.publicOwner, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if m NOT integrated into challenge variable', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            // Third element should have been m
            proof.constructChallengeRecurse([
                proof.sender,
                proof.publicValue,
                proof.publicOwner,
                proof.notes,
                proof.blindingFactors,
            ]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if notes NOT integrated into challenge variable', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            // Fifth element should have been the notes
            proof.constructChallengeRecurse([proof.sender, proof.publicValue, proof.m, proof.publicOwner, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blinding factors NOT integrated into challenge variable', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            // Sixth element should have been the blinding factors
            proof.constructChallengeRecurse([proof.sender, proof.publicValue, proof.m, proof.publicOwner, proof.notes]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, constants.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed H_X, H_Y in CRS', async () => {
            const { currentBurnCounterNote, newBurnCounterNote, burnedNotes } = await getDefaultBurnNotes();
            const proof = new BurnProof(currentBurnCounterNote, newBurnCounterNote, burnedNotes, sender);
            const data = proof.encodeABI();
            const malformedHx = constants.H_X.add(new BN(1));
            const malformedHy = constants.H_Y.add(new BN(1));
            const malformedCRS = [`0x${malformedHx.toString(16)}`, `0x${malformedHy.toString(16)}`, ...constants.t2];
            await truffleAssert.reverts(
                joinSplitFluidValidator.validateJoinSplitFluid(data, sender, malformedCRS),
                truffleAssert.ErrorType.REVERT,
            );
        });
    });
});
