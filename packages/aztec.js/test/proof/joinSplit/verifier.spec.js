/* eslint-disable prefer-arrow-callback */
const {
    constants: { K_MAX },
} = require('@aztec/dev-utils');
const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft, sha3 } = require('web3-utils');
const sinon = require('sinon');
const utils = require('@aztec/dev-utils');

const bn128 = require('../../../src/bn128');
const proof = require('../../../src/proof/joinSplit');
const verifier = require('../../../src/proof/joinSplit/verifier');
const proofHelpers = require('../../../src/proof/joinSplit/helpers');
const proofUtils = require('../../../src/proof/proofUtils');

const { errorTypes } = utils.constants;

const { expect } = chai;

function generateNoteValue() {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
}

function getKPublic(kIn, kOut) {
    return kOut.reduce((acc, v) => acc - v, kIn.reduce((acc, v) => acc + v, 0));
}

function generateBalancedNotes(nIn, nOut) {
    const kIn = [...Array(nIn)].map(() => generateNoteValue());
    const kOut = [...Array(nOut)].map(() => generateNoteValue());
    let delta = getKPublic(kIn, kOut);
    while (delta > 0) {
        if (delta >= K_MAX) {
            const k = generateNoteValue();
            kOut.push(k);
            delta -= k;
        } else {
            kOut.push(delta);
            delta = 0;
        }
    }
    while (delta < 0) {
        if (-delta >= K_MAX) {
            const k = generateNoteValue();
            kIn.push(k);
            delta += k;
        } else {
            kIn.push(-delta);
            delta = 0;
        }
    }
    return { kIn, kOut };
}

function randomAddress() {
    return `0x${padLeft(crypto.randomBytes(20).toString('hex'), 64)}`;
}

describe('join split verifier tests', function describeVerifier() {
    describe('success states', function success() {
        this.timeout(10000);
        it('creates a valid join-split proof', () => {
            const kIn = [80, 60];
            const kOut = [50, 100];
            const { commitments, m, trapdoor } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, -10);
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('validates join-split proof with 0 input notes', () => {
            const kIn = [];
            const kOut = [...Array(5)].map(() => generateNoteValue());

            const { commitments, m, trapdoor } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const kPublic = getKPublic(kIn, kOut);
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('validates join-split proof with 0 output notes', () => {
            const kIn = [...Array(5)].map(() => generateNoteValue());
            const kOut = [];

            const { commitments, m } = proofHelpers.generateCommitmentSet({ kIn, kOut });
            const kPublic = getKPublic(kIn, kOut);
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas).to.equal(undefined);
            expect(result.pairingSigmas).to.equal(undefined);
            expect(result.valid).to.equal(true);
        });

        it('validates join-split proof with large numbers of notes', () => {
            const kIn = [...Array(20)].map(() => generateNoteValue());
            const kOut = [...Array(20)].map(() => generateNoteValue());

            const { commitments, m, trapdoor } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });

            const kPublic = getKPublic(kIn, kOut);
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('validates join-split proof with uneven numberse of notes', () => {
            const { kIn, kOut } = generateBalancedNotes(20, 3);
            const { commitments, m, trapdoor } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });

        it('validates join-split proof with kPublic = 0', () => {
            const { kIn, kOut } = generateBalancedNotes(5, 10);
            const { commitments, m, trapdoor } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.pairingGammas.mul(trapdoor).eq(result.pairingSigmas.neg())).to.equal(true);
            expect(result.valid).to.equal(true);
        });
    });

    describe('failure states', function failure() {
        this.timeout(10000);
        let parseInputs;
        beforeEach(() => {
            // to test failure states we need to pass in bad data to verifier
            // so we need to turn off proof.parseInputs
            parseInputs = sinon.stub(proofUtils, 'parseInputs').callsFake(() => {});
        });

        afterEach(() => {
            parseInputs.restore();
        });

        it('REJECTS if points not on curve', () => {
            // we can construct 'proof' where all points and scalars are zero.
            // The challenge response is correctly reconstructed, but the proof should still be invalid
            const zeroes = `${padLeft('0', 64)}`;
            const noteString = [...Array(6)].reduce((acc) => `${acc}${zeroes}`, '');
            const sender = randomAddress();
            const challengeString = `${sender}${padLeft('132', 64)}${padLeft('1', 64)}${noteString}`;
            const challenge = `0x${new BN(sha3(challengeString, 'hex').slice(2), 16).umod(bn128.curve.n).toString(16)}`;
            const proofData = [[`0x${padLeft('132', 64)}`, '0x0', '0x0', '0x0', '0x0', '0x0']];

            const { valid, errors } = verifier.verifyProof(proofData, 1, challenge, sender);
            expect(valid).to.equal(false);
            expect(errors.length).to.equal(4);
            expect(errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(errors[1]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[2]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(errors[3]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
        });

        it('REJECTS if malformed challenge', () => {
            const kIn = [...Array(5)].map(() => generateNoteValue());
            const kOut = [...Array(5)].map(() => generateNoteValue());

            const { commitments, m } = proofHelpers.generateCommitmentSet({
                kIn,
                kOut,
            });
            const kPublic = getKPublic(kIn, kOut);
            const sender = randomAddress();
            const { proofData } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, `0x${crypto.randomBytes(31).toString('hex')}`, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('REJECTS if notes do not balance', () => {
            const { kIn, kOut } = generateBalancedNotes(5, 10);
            kIn.push(1);

            const { commitments, m } = proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('REJECTS for random proof data', () => {
            const proofData = [...Array(4)].map(() =>
                [...Array(6)].map(() => `0x${padLeft(crypto.randomBytes(32).toString('hex'), 64)}`),
            );
            const sender = randomAddress();
            const result = verifier.verifyProof(proofData, 1, `0x${crypto.randomBytes(31).toString('hex')}`, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors).to.contain(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('REJECTS if kPublic > group modulus', () => {
            const { kIn, kOut } = generateBalancedNotes(5, 10);
            const kPublic = bn128.curve.n.add(new BN(100));
            kIn.push(100);
            const { commitments, m } = proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, kPublic);

            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(1);
            expect(result.errors[0]).to.equal(errorTypes.SCALAR_TOO_BIG);
        });

        it('REJECTS if note value response is 0', () => {
            const { kIn, kOut } = generateBalancedNotes(5, 10);
            const { commitments, m } = proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData, challenge } = proof.constructProof(commitments, m, sender, 0);
            proofData[0][0] = '0x';
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(2);
            expect(result.errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('REJECTS if blinding factor is at infinity', () => {
            const { kIn, kOut } = { kIn: [10], kOut: [10] };
            const { commitments, m } = proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData } = proof.constructProof(commitments, m, sender, 0);
            proofData[0][0] = `0x${padLeft('05', 64)}`;
            proofData[0][1] = `0x${padLeft('05', 64)}`;
            proofData[0][2] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][3] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            proofData[0][4] = `0x${padLeft(bn128.h.x.fromRed().toString(16), 64)}`;
            proofData[0][5] = `0x${padLeft(bn128.h.y.fromRed().toString(16), 64)}`;
            const challenge = `0x${padLeft('0a', 64)}`;
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(2);
            expect(result.errors[0]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(result.errors[1]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });

        it('REJECTS if blinding factor computed from invalid point', () => {
            const { kIn, kOut } = { kIn: [10], kOut: [10] };
            const { commitments, m } = proofHelpers.generateCommitmentSet({ kIn, kOut });
            const sender = randomAddress();
            const { proofData } = proof.constructProof(commitments, m, sender, 0);
            proofData[0][0] = `0x${padLeft('', 64)}`;
            proofData[0][1] = `0x${padLeft('', 64)}`;
            proofData[0][2] = `0x${padLeft('', 64)}`;
            proofData[0][3] = `0x${padLeft('', 64)}`;
            proofData[0][4] = `0x${padLeft('', 64)}`;
            proofData[0][5] = `0x${padLeft('', 64)}`;
            const challenge = `0x${padLeft('', 64)}`;
            const result = verifier.verifyProof(proofData, m, challenge, sender);
            expect(result.valid).to.equal(false);
            expect(result.errors.length).to.equal(8);

            expect(result.errors[0]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[1]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[2]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[3]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(result.errors[4]).to.equal(errorTypes.NOT_ON_CURVE);
            expect(result.errors[5]).to.equal(errorTypes.SCALAR_IS_ZERO);
            expect(result.errors[6]).to.equal(errorTypes.BAD_BLINDING_FACTOR);
            expect(result.errors[7]).to.equal(errorTypes.CHALLENGE_RESPONSE_FAIL);
        });
    });
});
