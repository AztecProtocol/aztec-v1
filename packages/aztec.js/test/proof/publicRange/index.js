const secp256k1 = require('@aztec/secp256k1');
const { expect } = require('chai');
const { randomHex } = require('web3-utils');

const note = require('../../../src/note');
const { PublicRangeProof } = require('../../../src/proof');

describe('Public range proof', () => {
    let originalNote = {};
    const originalNoteValue = 50;
    let utilityNote = {};
    const utilityNoteValue = 40;
    const { publicKey } = secp256k1.generateAccount();
    const sender = randomHex(20);
    const publicComparison = 10;

    const isGreaterOrEqual = true;

    before(async () => {
        originalNote = await note.create(publicKey, originalNoteValue);
        utilityNote = await note.create(publicKey, utilityNoteValue);
    });

    it('should construct a public range proof with well-formed outputs', async () => {
        const proof = new PublicRangeProof(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote);
        expect(proof.data.length).to.equal(2);
        expect(proof.challengeHex.length).to.equal(66);
        expect(proof.data[0].length).to.equal(6);
        expect(proof.data[1].length).to.equal(6);
    });
});
