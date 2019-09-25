/* global artifacts, expect, contract, it:true */
const { PublicRangeProof, note, keccak } = require('aztec.js');
const secp256k1 = require('@aztec/secp256k1');
const bn128 = require('@aztec/bn128');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const { FAKE_CRS, mockZeroPublicRangeProof } = require('../../../helpers/proof');

const PublicRange = artifacts.require('./PublicRange');
const PublicRangeInterface = artifacts.require('./PublicRangeInterface');
PublicRange.abi = PublicRangeInterface.abi;

const Keccak = keccak;
let publicRangeValidator;
const { publicKey } = secp256k1.generateAccount();

const getNotes = async (originalNoteValue, utilityNoteValue) => {
    const originalNote = await note.create(publicKey, originalNoteValue);
    const utilityNote = await note.create(publicKey, utilityNoteValue);
    return { originalNote, utilityNote };
};

const getDefaultGreaterThanNotes = async () => {
    const isGreaterOrEqual = true;
    const originalNoteValue = 50;
    const utilityNoteValue = 40;
    const publicComparison = 10;
    const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
    return { originalNote, utilityNote, publicComparison, isGreaterOrEqual };
};

const getDefaultLessThanNotes = async () => {
    const isGreaterOrEqual = false;
    const originalNoteValue = 10;
    const utilityNoteValue = 30;
    const publicComparison = 20;
    const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
    return { originalNote, utilityNote, publicComparison, isGreaterOrEqual };
};

contract('Public range validator', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        publicRangeValidator = await PublicRange.new({ from: sender });
    });

    describe('Greater than tests', () => {
        describe('Success states', () => {
            it('should validate public range proof when given explicit utilityNote', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const data = proof.encodeABI();
                const result = await publicRangeValidator.validatePublicRange(data, sender, bn128.CRS, { from: sender });
                expect(result).to.equal(proof.eth.outputs);
            });

            it('should validate public range proof for note of zero value', async () => {
                const isGreaterOrEqual = true;
                const originalNoteValue = 10;
                const utilityNoteValue = 0;
                const publicComparison = 10;
                const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const data = proof.encodeABI();
                const result = await publicRangeValidator.validatePublicRange(data, sender, bn128.CRS);
                expect(result).to.equal(proof.eth.outputs);
            });

            it('should validate public range proof with challenge that has group modulus added to it', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                proof.challenge = proof.challenge.add(bn128.groupModulus);
                proof.constructOutputs(); // why do we have to do this?
                const data = proof.encodeABI();
                const result = await publicRangeValidator.validatePublicRange(data, sender, bn128.CRS);
                expect(result).to.equal(proof.eth.outputs);
            });
        });

        describe('Failure states', () => {
            it('should fail if notes do NOT balance', async () => {
                const isGreaterOrEqual = true;
                const originalNoteValue = 50;
                const utilityNoteValue = 41;
                const publicComparison = 10;
                const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote, false);
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail when note value is less than public integer', async () => {
                const isGreaterOrEqual = true;
                const originalNoteValue = 9;
                const utilityNoteValue = 0;
                const publicComparison = 10;
                const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote, false);
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail for random proof data', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                proof.data = [];
                for (let i = 0; i < 2; i += 1) {
                    proof.data[i] = [];
                    for (let j = 0; j < 6; j += 1) {
                        proof.data[i][j] = randomHex(32);
                    }
                }
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail for fake challenge', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                proof.challenge = new BN('0');
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if scalars are NOT mod(GROUP_MODULUS)', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const kBar = new BN(proof.data[0][0].slice(2), 16);
                const notModRKBar = `0x${kBar.add(bn128.groupModulus).toString(16)}`;
                proof.data[0][0] = notModRKBar;
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if blinding factor resolves to point at infinity', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                proof.data[0][0] = padLeft('0x05', 64);
                proof.data[0][1] = padLeft('0x05', 64);
                proof.data[0][2] = `0x${bn128.H_X.toString(16)}`;
                proof.data[0][3] = `0x${bn128.H_Y.toString(16)}`;
                proof.data[0][4] = `0x${bn128.H_X.toString(16)}`;
                proof.data[0][5] = `0x${bn128.H_Y.toString(16)}`;
                proof.challenge = new BN('0a', 16);
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if scalars are zero', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const zeroScalar = padLeft('0x00', 64);
                proof.data[0][0] = zeroScalar;
                proof.data[0][1] = zeroScalar;
                proof.data[1][0] = zeroScalar;
                proof.data[1][1] = zeroScalar;
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail for incorrect H_X, H_Y in CRS', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const malformedHx = bn128.H_X.add(new BN(1));
                const malformedHy = bn128.H_Y.add(new BN(1));
                const malformedCRS = [`0x${malformedHx.toString(16)}`, `0x${malformedHy.toString(16)}`, ...bn128.t2];
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, malformedCRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if provided 0 notes', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                proof.data = [];
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if sender NOT integrated into challenge variable', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                // First element should have been the sender
                proof.challengeHash = new Keccak();
                proof.constructChallengeRecurse([
                    proof.publicComparison,
                    proof.publicValue,
                    proof.publicOwner,
                    proof.notes,
                    proof.blindingFactors,
                ]);
                proof.challenge = proof.challengeHash.redKeccak();
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if publicComparison NOT integrated into challenge variable', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                // Second element should have been the publicComparison
                proof.challengeHash = new Keccak();
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
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if publicValue NOT integrated into challenge variable', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                // Third element should have been the publicValue
                proof.challengeHash = new Keccak();
                proof.constructChallengeRecurse([
                    proof.sender,
                    proof.publicComparison,
                    proof.publicOwner,
                    proof.notes,
                    proof.blindingFactors,
                ]);
                proof.challenge = proof.challengeHash.redKeccak();
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if publicOwner NOT integrated into challenge variable', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                // Fourth element should have been the publicOwner
                proof.challengeHash = new Keccak();
                proof.constructChallengeRecurse([
                    proof.sender,
                    proof.publicComparison,
                    proof.publicValue,
                    proof.notes,
                    proof.blindingFactors,
                ]);
                proof.challenge = proof.challengeHash.redKeccak();
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if notes NOT integrated into challenge variable', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                // Fifth element should have been the notes
                proof.challengeHash = new Keccak();
                proof.constructChallengeRecurse([
                    proof.sender,
                    proof.publicComparison,
                    proof.publicValue,
                    proof.publicOwner,
                    proof.blindingFactors,
                ]);
                proof.challenge = proof.challengeHash.redKeccak();
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if blindingFactors NOT integrated into challenge variable', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                // Sixth element should have been the blindingFactors
                proof.challengeHash = new Keccak();
                proof.constructChallengeRecurse([
                    proof.sender,
                    proof.publicComparison,
                    proof.publicValue,
                    proof.publicOwner,
                    proof.notes,
                ]);
                proof.challenge = proof.challengeHash.redKeccak();
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail if points are NOT on the curve', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const zeroPublicRangeProof = await mockZeroPublicRangeProof();
                proof.data = zeroPublicRangeProof.data;
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail for fake trusted setup public key', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultGreaterThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, FAKE_CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });
        });
    });

    describe('Less than tests', () => {
        describe('Success states', () => {
            it('should validate a less than proof', async () => {
                const { originalNote, utilityNote, publicComparison, isGreaterOrEqual } = await getDefaultLessThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const data = proof.encodeABI();
                const result = await publicRangeValidator.validatePublicRange(data, sender, bn128.CRS, { from: sender });
                expect(result).to.equal(proof.eth.outputs);
            });

            it('should succeed for originalValue = publicComparison, when making a less than or equal to', async () => {
                const isGreaterOrEqual = false;
                const originalNoteValue = 20;
                const utilityNoteValue = 40;
                const publicComparison = 20;
                const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
                const data = proof.encodeABI();
                const result = await publicRangeValidator.validatePublicRange(data, sender, bn128.CRS, { from: sender });
                expect(result).to.equal(proof.eth.outputs);
            });
        });

        describe('Failure states', () => {
            it('should fail for an unbalanced less than proof', async () => {
                const isGreaterOrEqual = false;
                const originalNoteValue = 20;
                const utilityNoteValue = 0;
                const publicComparison = 20;
                const { originalNote, utilityNote } = await getNotes(originalNoteValue, utilityNoteValue);
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote, false);
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });

            it('should fail for a less than proof, when a greater than proof is specified', async () => {
                const isGreaterOrEqual = true;
                const { originalNote, utilityNote, publicComparison } = await getDefaultLessThanNotes();
                const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote, false);
                const data = proof.encodeABI();
                await truffleAssert.reverts(
                    publicRangeValidator.validatePublicRange(data, sender, bn128.CRS),
                    truffleAssert.ErrorType.REVERT,
                );
            });
        });
    });
});
