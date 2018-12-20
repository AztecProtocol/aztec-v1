/**
 * Helper methods to construct AZTEC zero-knowledge proof commitments. Used for debugging and testing.
 *
 * @namespace proofHelpers
 * @memberof module:proof
 */

const BN = require('bn.js');
const crypto = require('crypto');
const { padLeft, toHex } = require('web3-utils');
const aztecNote = require('../note/note');
const bn128 = require('../bn128/bn128');
const secp256k1 = require('../secp256k1/secp256k1');

const helpers = {};

function generateCommitment(k) {
    const a = padLeft(new BN(crypto.randomBytes(32), 16).umod(bn128.n).toString(16), 64);
    const kHex = padLeft(toHex(Number(k).toString(10)).slice(2), 8);
    const ephemeral = secp256k1.keyFromPrivate(crypto.randomBytes(32));
    const viewKey = `0x${a}${kHex}${padLeft(ephemeral.getPublic(true, 'hex'), 66)}`;
    return aztecNote.fromViewKey(viewKey);
}

// constructs an AZTEC commitment directly from the setup algorithm's trapdoor key.
// Used for testing purposes only; we don't know the trapdoor key for the real deal.
function generateFakeCommitment(k, trapdoor) {
    const kBn = new BN(k).toRed(bn128.groupReduction);
    const mu = bn128.h.mul(trapdoor.redSub(kBn).redInvm());
    const a = new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
    const gamma = mu.mul(a);
    const sigma = gamma.mul(kBn).add(bn128.h.mul(a));
    return {
        gamma,
        sigma,
        a,
        k: kBn,
    };
}

/**
 * Create a set of AZTEC commitments from vectors of input and output values
 * @method generateCommitmentSet
 * @memberof module:proof.proofHelpers
 * @param {Object} values
 * @param {number[]} values.kIn vector of input note values
 * @param {number[]} values.kOut vector of output note values
 * @returns {Object} AZTEC commitment array
 */
helpers.generateCommitmentSet = ({ kIn, kOut }) => {
    const inputs = kIn.map((k) => {
        return generateCommitment(k);
    });
    const outputs = kOut.map((k) => {
        return generateCommitment(k);
    });
    const commitments = [...inputs, ...outputs];
    return { commitments, m: inputs.length };
};

/**
 * Create a set of fake AZTEC commitments from vectors of input and output values.
 * This method uses a randomly generated trapdoor key instead of the trusted setup key.
 * @method generateFakeCommitmentSet
 * @memberof module:proof.proofHelpers
 * @param {Object} values
 * @param {number[]} values.kIn vector of input note values
 * @param {number[]} values.kOut vector of output note values
 * @returns {Object} AZTEC commitment array
 */
helpers.generateFakeCommitmentSet = ({ kIn, kOut }) => {
    const trapdoor = new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
    const inputs = kIn.map((k) => {
        return generateFakeCommitment(k, trapdoor);
    });
    const outputs = kOut.map((k) => {
        return generateFakeCommitment(k, trapdoor);
    });
    const commitments = [...inputs, ...outputs];
    return { commitments, m: inputs.length, trapdoor };
};

module.exports = helpers;
