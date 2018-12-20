const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft } = require('web3-utils');

const bn128 = require('../bn128/bn128');
const proof = require('./proof');
const proofHelpers = require('./helpers');
const { K_MAX } = require('../params');

const { expect } = chai;

function generateNoteValue() {
    return new BN(crypto.randomBytes(32), 16).umod(new BN(K_MAX)).toNumber();
}

function getKPublic(kIn, kOut) {
    return kOut.reduce(
        (acc, v) => acc - v,
        kIn.reduce((acc, v) => acc + v, 0)
    );
}

function randomAddress() {
    return `0x${padLeft(crypto.randomBytes(20, 16).toString('hex'), 64)}`;
}

function validateGroupScalar(hex, canBeZero = false) {
    const scalar = new BN(hex.slice(2), 16);
    expect(scalar.lt(bn128.n)).to.equal(true);
    if (!canBeZero) {
        expect(scalar.gt(new BN(0))).to.equal(true);
    }
}

function validateGroupElement(xHex, yHex) {
    const x = new BN(xHex.slice(2), 16);
    const y = new BN(yHex.slice(2), 16);
    expect(x.gt(new BN(0))).to.equal(true);
    expect(y.gt(new BN(0))).to.equal(true);
    expect(x.lt(bn128.p)).to.equal(true);
    expect(y.lt(bn128.p)).to.equal(true);
    const lhs = x.mul(x).mul(x).add(new BN(3));
    const rhs = y.mul(y);
    expect(lhs.umod(bn128.p).eq(rhs.umod(bn128.p))).that.equal(true);
}

describe('AZTEC proof construction tests', () => {
    it('proof.constructJoinSplit creates a proof with well-formed outputs', () => {
        const kIn = [...Array(2)].map(() => generateNoteValue());
        const kOut = [...Array(3)].map(() => generateNoteValue());

        const { commitments, m } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
        const k = getKPublic(kIn, kOut);
        const kPublic = bn128.n.add(new BN(k)).umod(bn128.n);

        const { proofData, challenge } = proof.constructJoinSplit(commitments, m, randomAddress(), kPublic);

        expect(proofData.length).to.equal(5);
        expect(challenge.length).to.equal(66);
        validateGroupScalar(challenge);
        proofData.forEach((note, i) => {
            validateGroupScalar(note[0], i === (proofData.length - 1));
            validateGroupScalar(note[1]);
            validateGroupElement(note[2], note[3]);
            validateGroupElement(note[4], note[5]);
        });
        expect(new BN(proofData[proofData.length - 1][0].slice(2), 16).eq(kPublic)).to.equal(true);
    });

    it('proof.constructJoinSplit will throw if kPublic is malformed', () => {
        const kIn = [...Array(2)].map(() => generateNoteValue());
        const kOut = [...Array(3)].map(() => generateNoteValue());

        const { commitments, m } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
        const kPublic = bn128.n.add(new BN(100));

        try {
            proof.constructJoinSplit(commitments, m, randomAddress(), kPublic);
        } catch (err) {
            expect(err.message).to.contain('kPublic value malformed');
        }
    });

    it('proof.constructJoinSplit will throw if m is malformed', () => {
        const kIn = [...Array(2)].map(() => generateNoteValue());
        const kOut = [...Array(3)].map(() => generateNoteValue());
        const kPublic = getKPublic(kIn, kOut);
        const { commitments } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });

        try {
            proof.constructJoinSplit(commitments, 500, randomAddress(), kPublic);
        } catch (err) {
            expect(err.message).to.contain('m is greater than note array length');
        }
    });

    it('proof.constructJoinSplit will throw if point not on curve', () => {
        const kIn = [...Array(2)].map(() => generateNoteValue());
        const kOut = [...Array(3)].map(() => generateNoteValue());
        const kPublic = getKPublic(kIn, kOut);
        const { commitments } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
        commitments[0].gamma.x = new BN(bn128.p.add(new BN(100))).toRed(bn128.red);
        try {
            proof.constructJoinSplit(commitments, 500, randomAddress(), kPublic);
        } catch (err) {
            expect(err.message).to.contain('point not on curve');
        }
    });

    it('proof.constructJoinSplit will throw if point at infinity', () => {
        const kIn = [...Array(2)].map(() => generateNoteValue());
        const kOut = [...Array(3)].map(() => generateNoteValue());
        const kPublic = getKPublic(kIn, kOut);
        const { commitments, m } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
        commitments[0].gamma = commitments[0].gamma.add(commitments[0].gamma.neg());
        let message = '';
        try {
            proof.constructJoinSplit(commitments, m, randomAddress(), kPublic);
        } catch (err) {
            ({ message } = err);
        }
        expect(message).to.contain('point at infinity');
    });

    it('proof.constructJoinSplit will throw if viewing key response is 0', () => {
        const kIn = [...Array(2)].map(() => generateNoteValue());
        const kOut = [...Array(3)].map(() => generateNoteValue());
        const kPublic = getKPublic(kIn, kOut);
        const { commitments, m } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
        commitments[0].a = new BN(0).toRed(bn128.groupReduction);
        try {
            proof.constructJoinSplit(commitments, m, randomAddress(), kPublic);
        } catch (err) {
            expect(err.message).to.contain('viewing key malformed');
        }
    });

    it('proof.constructJoinSplit will throw if value > K_MAX', () => {
        const kIn = [...Array(2)].map(() => generateNoteValue());
        const kOut = [...Array(3)].map(() => generateNoteValue());
        const kPublic = getKPublic(kIn, kOut);
        const { commitments, m } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
        commitments[0].k = new BN(K_MAX + 1).toRed(bn128.groupReduction);
        try {
            proof.constructJoinSplit(commitments, m, randomAddress(), kPublic);
        } catch (err) {
            expect(err.message).to.contain('note value malformed');
        }
    });
});
