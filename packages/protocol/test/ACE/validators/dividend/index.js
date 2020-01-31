/* global artifacts, expect, contract, it:true */
const { DividendProof, note, keccak } = require('aztec.js');
const bn128 = require('@aztec/bn128');
const { constants } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const BN = require('bn.js');
const truffleAssert = require('truffle-assertions');
const { padLeft, randomHex } = require('web3-utils');

const { FAKE_CRS, mockZeroDividendProof } = require('../../../helpers/proof');

const Dividend = artifacts.require('./Dividend');
const DividendInterface = artifacts.require('./DividendInterface');
Dividend.abi = DividendInterface.abi;

let dividendValidator;
const Keccak = keccak;
const { publicKey } = secp256k1.generateAccount();
const { K_MAX } = constants;

const getNotes = async (notionalNoteValue, residualNoteValue, targetNoteValue) => {
    const notionalNote = await note.create(publicKey, notionalNoteValue);
    const residualNote = await note.create(publicKey, residualNoteValue);
    const targetNote = await note.create(publicKey, targetNoteValue);
    return { notionalNote, residualNote, targetNote };
};

const getDefaultNotes = async () => {
    const notionalNoteValue = 90;
    const residualNoteValue = 50;
    const targetNoteValue = 4;
    const { notionalNote, residualNote, targetNote } = await getNotes(notionalNoteValue, residualNoteValue, targetNoteValue);
    const za = 100;
    const zb = 5;
    return { notionalNote, residualNote, targetNote, za, zb };
};

contract('Dividend Validator', (accounts) => {
    const sender = accounts[0];

    before(async () => {
        dividendValidator = await Dividend.new({ from: sender });
    });

    describe('Success States', () => {
        it('should validate Dividend proof', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            const result = await dividendValidator.validateDividend(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });

        it('should validate Dividend proof with challenge that has group modulus added to it', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = proof.challenge.add(bn128.groupModulus);
            proof.constructOutputs();
            const data = proof.encodeABI();
            const result = await dividendValidator.validateDividend(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });

        it('should validate proof when za = 0', async () => {
            // (k1 * zb) = (k2 * za) + k3
            // (10 * 2) = (3 * 0) + 20
            const za = 0;
            const zb = 2;

            const k1 = 10;
            const k2 = 3;
            const k3 = 20;
            const notionalNote = await note.create(publicKey, k1);
            const targetNote = await note.create(publicKey, k2);
            const residualNote = await note.create(publicKey, k3);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = proof.challenge.add(bn128.groupModulus);
            proof.constructOutputs();
            const data = proof.encodeABI();
            const result = await dividendValidator.validateDividend(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });

        it('should validate proof when za = K_MAX', async () => {
            // (k1 * zb) = (k2 * za) + k3
            // (4 * K_MAX/2) = (2 * K_MAX) + 0
            const za = K_MAX;
            const zb = K_MAX / 2;

            const k1 = 4;
            const k2 = 2;
            const k3 = 0;
            const notionalNote = await note.create(publicKey, k1);
            const targetNote = await note.create(publicKey, k2);
            const residualNote = await note.create(publicKey, k3);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = proof.challenge.add(bn128.groupModulus);
            proof.constructOutputs();
            const data = proof.encodeABI();
            const result = await dividendValidator.validateDividend(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });

        it('should validate proof when zb = K_MAX', async () => {
            // (k1 * zb) = (k2 * za) + k3
            // (1 * KMAX) = (3 * 3333333) + 0
            const za = K_MAX / 2; // K_MAX / 3
            const zb = K_MAX;

            const k1 = 1;
            const k2 = 2;
            const k3 = 0;
            const notionalNote = await note.create(publicKey, k1);
            const targetNote = await note.create(publicKey, k2);
            const residualNote = await note.create(publicKey, k3);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = proof.challenge.add(bn128.groupModulus);
            proof.constructOutputs();
            const data = proof.encodeABI();
            const result = await dividendValidator.validateDividend(data, sender, bn128.CRS, { from: sender });
            expect(result).to.equal(proof.eth.outputs);
        });
    });

    describe('Failure States', () => {
        it('should fail if notes do NOT balance', async () => {
            const notionalNoteValue = 90;
            const residualNoteValue = 3;
            const targetNoteValue = 50;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 0 notes', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 1 notes instead of 3', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [proof.data[0]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if provided 2 notes instead of 3', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [proof.data[0], proof.data[1]];
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if notional note is 0', async () => {
            const notionalNoteValue = 0;
            const residualNoteValue = 4;
            const targetNoteValue = 50;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if residual note is 0', async () => {
            const notionalNoteValue = 90;
            const residualNoteValue = 0;
            const targetNoteValue = 50;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if target note is 0', async () => {
            const notionalNoteValue = 90;
            const residualNoteValue = 4;
            const targetNoteValue = 0;
            const { notionalNote, residualNote, targetNote } = await getNotes(
                notionalNoteValue,
                residualNoteValue,
                targetNoteValue,
            );
            const za = 100;
            const zb = 5;
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail to validate proof when zb = 0', async () => {
            // (k1 * zb) = (k2 * za) + k3
            // (10 * 0) = (3 * 0) + 0
            // results in \bar{k3} = 0, which upon exponentiating will produce a
            // point at infinity. This should revert
            const za = 0;
            const zb = 0;

            const k1 = 10;
            const k2 = 3;
            const k3 = 0;
            const notionalNote = await note.create(publicKey, k1);
            const targetNote = await note.create(publicKey, k2);
            const residualNote = await note.create(publicKey, k3);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = proof.challenge.add(bn128.groupModulus);
            proof.constructOutputs();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS, { from: sender }),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail for za > K_MAX', async () => {
            // (k1 * zb) = (k2 * za) + k3
            // (1 * 1) = (0 * K_MAX + 1) + 1
            //  => K_MAX - 1 = 1

            const za = K_MAX + 1;
            const zb = 1;

            const k1 = 1;
            const k2 = 0;
            const k3 = 1;
            const notionalNote = await note.create(publicKey, k1);
            const targetNote = await note.create(publicKey, k2);
            const residualNote = await note.create(publicKey, k3);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail for for zb > K_MAX', async () => {
            // (k1 * zb) = (k2 * za) + k3
            // (1 * K_MAX + 100) = (1 * K_MAX - 1) + 101
            //  => K_MAX - 1 = 1
            const za = K_MAX - 1;
            const zb = K_MAX + 100;

            const k1 = 1;
            const k2 = 1;
            const k3 = 101;
            const notionalNote = await note.create(publicKey, k1);
            const targetNote = await note.create(publicKey, k2);
            const residualNote = await note.create(publicKey, k3);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail for large za, zb', async () => {
            // (k1 * zb) = (k2 * za) + k3
            // (1 * 4294967293) = (1 * 4294967295) + 0
            //  => 4294967295 = 4294967295

            const za = 2 ** 32 - 1; // 4294967295
            const zb = 2 ** 32 - 1; // 4294967295

            const k1 = 1;
            const k2 = 1;
            const k3 = 0;
            const notionalNote = await note.create(publicKey, k1);
            const targetNote = await note.create(publicKey, k2);
            const residualNote = await note.create(publicKey, k3);

            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed proof data', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data = [];
            for (let i = 0; i < 4; i += 1) {
                proof.data[i] = [];
                for (let j = 0; j < 6; j += 1) {
                    proof.data[i][j] = randomHex(32);
                }
            }
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if points NOT on curve', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const zeroDividendProof = await mockZeroDividendProof();
            proof.data = zeroDividendProof.data;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars NOT modulo group modulus', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const kBar = new BN(proof.data[0][0].slice(2), 16);
            const notModRKBar = `0x${kBar.add(bn128.groupModulus).toString(16)}`;
            proof.data[0][0] = notModRKBar;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if scalars are 0', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const zeroScalar = padLeft('0x00', 64);
            proof.data[0][0] = zeroScalar;
            proof.data[0][1] = zeroScalar;
            proof.data[1][0] = zeroScalar;
            proof.data[1][1] = zeroScalar;
            proof.data[2][0] = zeroScalar;
            proof.data[2][1] = zeroScalar;
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blinding factors resolve to point at infinity', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.data[0][0] = padLeft('0x05', 64);
            proof.data[0][1] = padLeft('0x05', 64);
            proof.data[0][2] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][3] = `0x${bn128.H_Y.toString(16)}`;
            proof.data[0][4] = `0x${bn128.H_X.toString(16)}`;
            proof.data[0][5] = `0x${bn128.H_Y.toString(16)}`;
            proof.challenge = new BN('0a', 16);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed challenge', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            proof.challenge = new BN('0');
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if sender NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // First element should have been the sender
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.za, proof.zb, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if za NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Second element should have been za
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.zb, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if zb NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Third element should have been zb
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.za, proof.notes, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if notes NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Fourth element should have been the notes
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.za, proof.zb, proof.blindingFactors]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if blinding factors NOT integrated into challenge variable', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            // Fifth element should have been the blinding factors
            proof.challengeHash = new Keccak();
            proof.constructChallengeRecurse([proof.sender, proof.za, proof.zb, proof.notes]);
            proof.challenge = proof.challengeHash.redKeccak();
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, bn128.CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail if malformed H_X, H_Y in CRS', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            const malformedHx = bn128.H_X.add(new BN(1));
            const malformedHy = bn128.H_Y.add(new BN(1));
            const malformedCRS = [`0x${malformedHx.toString(16)}`, `0x${malformedHy.toString(16)}`, ...bn128.t2];
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, malformedCRS),
                truffleAssert.ErrorType.REVERT,
            );
        });

        it('should fail for fake trusted setup public key', async () => {
            const { notionalNote, residualNote, targetNote, za, zb } = await getDefaultNotes();
            const proof = new DividendProof(notionalNote, residualNote, targetNote, sender, za, zb);
            const data = proof.encodeABI();
            await truffleAssert.reverts(
                dividendValidator.validateDividend(data, sender, FAKE_CRS),
                truffleAssert.ErrorType.REVERT,
            );
        });
    });
});
