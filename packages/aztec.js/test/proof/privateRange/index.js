/* eslint-disable prefer-destructuring */
import { errors } from '@aztec/dev-utils';

import secp256k1 from '@aztec/secp256k1';
import { expect } from 'chai';
import { randomHex } from 'web3-utils';
import { PrivateRangeProof } from '../../../src/proof';
import note from '../../../src/note';

describe('Private range proof', () => {
    const { publicKey } = secp256k1.generateAccount();
    const sender = randomHex(20);
    let originalNote = {};
    const originalNoteValue = 10;
    let comparisonNote = {};
    const comparisonNoteValue = 4;
    let utilityNote = {};
    const utilityNoteValue = 6;

    beforeEach(async () => {
        originalNote = await note.create(publicKey, originalNoteValue);
        comparisonNote = await note.create(publicKey, comparisonNoteValue);
        utilityNote = await note.create(publicKey, utilityNoteValue);
    });

    describe('Success States', () => {
        it('should construct a private range proof with well-formed outputs', async () => {
            const proof = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);

            const numNotes = 3;
            expect(proof.data.length).to.equal(numNotes);
            expect(proof.challengeHex.length).to.equal(66);
            expect(proof.data[0].length).to.equal(6);
            expect(proof.data[1].length).to.equal(6);
            expect(proof.data[2].length).to.equal(6);
        });
    });

    describe('Failure States', () => {
        it('should fail if number of notes is greater than 3', async () => {
            try {
                const _ = new PrivateRangeProof(originalNote, comparisonNote, utilityNote, sender);
            } catch (err) {
                expect(err.message).to.equal(errors.codes.INCORRECT_NOTE_NUMBER);
            }
        });

        it('should fail if supplied notes do not satisfy balancing relationship', async () => {
            const bogusUtilityNoteValue = 5;
            const bogusUtilityNote = await note.create(publicKey, bogusUtilityNoteValue);

            try {
                const _ = new PrivateRangeProof(originalNote, comparisonNote, bogusUtilityNote, sender);
            } catch (err) {
                expect(err.message).to.equal(errors.codes.BALANCING_RELATION_NOT_SATISFIED);
            }
        });
    });
});
