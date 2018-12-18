const BN = require('bn.js');
const crypto = require('crypto');
const bn128 = require('../../bn128/bn128');
const untrustedSetup = require('../../setup/untrustedSetup');

const { groupReduction } = bn128;
const fakeProof = {};

// This generates the commitment
fakeProof.generateCommitment = async (k) => {
    const kBn = new BN(k).toRed(groupReduction);
    const { x, y } = await untrustedSetup.createSignature(k);
    // these are the various commitment variables
    const mu = bn128.point(x, y);
    const a = new BN(crypto.randomBytes(32), 16).toRed(groupReduction);
    const gamma = mu.mul(a);
    const sigma = gamma.mul(kBn).add(bn128.h.mul(a));
    return {
        gamma, // half of the Pedersen commitment
        sigma, // other half of the Pedersen commitment
        a, // randomness
        k: kBn, // message/note value
    };
};

fakeProof.constructModifiedCommitmentSet = async ({ kIn, kOut }) => {
    const inputs = await Promise.all(kIn.map(async (k) => {
        return fakeProof.generateCommitment(k);
    }));
    const outputs = await Promise.all(kOut.map(async (k) => {
        return fakeProof.generateCommitment(k);
    }));
    const commitments = [...inputs, ...outputs];
    return { commitments, m: inputs.length };
};

module.exports = fakeProof;
