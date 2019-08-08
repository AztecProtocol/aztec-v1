const { errors } = require('@aztec/dev-utils');
const secp256k1 = require('@aztec/secp256k1');
const { expect } = require('chai');
const { randomHex } = require('web3-utils');

const note = require('../../../src/note');
const { PublicRangeProof } = require('../../../src/proof');

describe('Public range proof', () => {
    const { publicKey } = secp256k1.generateAccount();
    let originalNote;
    const originalNoteValue = 50;
    let utilityNote;
    const utilityNoteValue = 40;
    const sender = randomHex(20);
    const publicComparison = 10;
    const isGreaterOrEqual = true;

    beforeEach(async () => {
        originalNote = await note.create(publicKey, originalNoteValue);
        utilityNote = await note.create(publicKey, utilityNoteValue);
    });

    describe('Success states', () => {
        it('should construct a public range proof with well-formed outputs', async () => {
            const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
            expect(proof.data.length).to.equal(2);
            expect(proof.challengeHex.length).to.equal(66);
            expect(proof.data[0].length).to.equal(6);
            expect(proof.data[1].length).to.equal(6);
        });
    });

    describe('Failure states', () => {
        it('should fail if supplied notes do not satisfy balancing relationship', async () => {
            const bogusUtilityNoteValue = 5;
            const bogusUtilityNote = await note.create(publicKey, bogusUtilityNoteValue);
            let error;

            try {
                const _ = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, bogusUtilityNote);
            } catch (err) {
                error = err;
            }
            expect(error.message).to.equal(errors.codes.BALANCING_RELATION_NOT_SATISFIED);
        });
    });
});
