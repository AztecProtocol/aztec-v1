/* global artifacts, expect, contract, it:true */
const { PrivateRangeProof, note, keccak } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const { mockZeroPrivateRangeProof } = require('../../../helpers/proof');

const PrivateRange = artifacts.require('./PrivateRange');
const PrivateRangeInterface = artifacts.require('./PrivateRangeInterface');
PrivateRange.abi = PrivateRangeInterface.abi;

let privateRangeValidator;
const Keccak = keccak;
const { publicKey } = secp256k1.generateAccount();

const getNotes = async (originalNoteValue, comparisonNoteValue, utilityNoteValue) => {
    const originalNote = await note.create(publicKey, originalNoteValue);
    const comparisonNote = await note.create(publicKey, comparisonNoteValue);
    const utilityNote = await note.create(publicKey, utilityNoteValue);
    return { originalNote, comparisonNote, utilityNote };
};

const getDefaultNotes = async () => {
    const originalNoteValue = 10;
    const comparisonNoteValue = 4;
    const utilityNoteValue = 6;
    const { originalNote, comparisonNote, utilityNote } = await getNotes(
        originalNoteValue,
        comparisonNoteValue,
        utilityNoteValue,
    );
    return { originalNote, comparisonNote, utilityNote };
};

contract('Private range validator', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        privateRangeValidator = await PrivateRange.new({ from: sender });
    });

    describe('Success States', () => {
        it('should validate private range proof', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const data = proof.encodeABI();
            const result = await privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });

        it('should validate for comparison note of zero value', async () => {
            const originalNoteValue = 10;
            const comparisonNoteValue = 0;
            const utilityNoteValue = 10;
            const { originalNote, comparisonNote, utilityNote } = await getNotes(
                originalNoteValue,
                comparisonNoteValue,
                utilityNoteValue,
            );
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const data = proof.encodeABI();
            const result = await privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });

        it('should validate for utility note of zero value', async () => {
            const originalNoteValue = 0;
            const comparisonNoteValue = 0;
            const utilityNoteValue = 0;
            const { originalNote, comparisonNote, utilityNote } = await getNotes(
                originalNoteValue,
                comparisonNoteValue,
                utilityNoteValue,
            );
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const data = proof.encodeABI();
            const result = await privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });

        it('should validate private range proof with challenge that has group modulus added to it', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            proof.challenge = proof.challenge.add(bn128.groupModulus);
            proof.constructOutputs();
            const data = proof.encodeABI();
            const result = await privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });
    });

    describe('Failure states', () => {
        it('should fail if notes do not balance', async () => {
            const originalNoteValue = 10;
            const comparisonNoteValue = 20;
            const utilityNoteValue = 30;
            const { originalNote, comparisonNote, utilityNote } = await getNotes(
                originalNoteValue,
                comparisonNoteValue,
                utilityNoteValue,
            );
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 0 notes', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            proof.data = [];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 1 note instead of 3', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            proof.data = [proof.data[0]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 2 notes instead of 3', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            proof.data = [proof.data[0], proof.data[1]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed proof data', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            proof.data = [];
            for (let i = 0; i < 3; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed challenge', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            proof.challenge = new BN('0');
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if points not on the curve', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const zeroPrivateRangeProof = await mockZeroPrivateRangeProof();
            proof.data = zeroPrivateRangeProof.data;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars NOT modulo group modulus', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const kBar = new BN(proof.data[0][0].slice(2), 16);
            const notModRKBar = `0x${kBar.add(bn128.groupModulus).toString(16)}`;
            proof.data[0][0] = notModRKBar;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars are 0', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const zeroScalar = padLeft('0x00', 64);
            proof.data[0][0] = zeroScalar;
            proof.data[0][1] = zeroScalar;
            proof.data[1][0] = zeroScalar;
            proof.data[1][1] = zeroScalar;
            proof.data[2][0] = zeroScalar;
            proof.data[2][1] = zeroScalar;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][3] = `0x${bn128.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][5] = `0x${bn128.H_Y.toString(16)}`;
            proof.challenge = new BN('0a', 16);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail for incorrect H_X, H_Y in CRS', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            const malformedHx = bn128.H_X.add(new BN(1));
            const malformedHy = bn128.H_Y.add(new BN(1));
            const malformedCRS = [`0x${malformedHx.toString(16)}`, `0x${malformedHy.toString(16)}`, ...bn128.t2];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, malformedCRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        // it.only('should fail for no notes', async() => {

        // });

        // it.only('should fail for too many notes', async() => {

        // });

        it('should fail if sender address NOT integrated into challenge variable', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            // First element should have been the sender
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.publicValue, proof.publicOwner, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if publicValue NOT integrated into challenge variable', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            // Second element should have been the publicValue
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.publicOwner, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if publicOwner address NOT integrated into challenge variable', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            // Third element should have been the publicOwner
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.publicValue, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if notes NOT integrated into challenge variable', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            // Fourth element should have been the notes
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.publicValue, proof.publicOwner, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blindingFactors NOT integrated into challenge variable', async () => {
            const { originalNote, comparisonNote, utilityNote } = await getDefaultNotes();
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            // Fifth element should have been the blindingFactors
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.publicValue, proof.publicOwner, proof.notes]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                privateRangeValidator.validatePrivateRange(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });
    });
});
