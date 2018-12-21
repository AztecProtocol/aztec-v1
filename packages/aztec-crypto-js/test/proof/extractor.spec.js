const BN = require('bn.js');
const chai = require('chai');
const crypto = require('crypto');
const { padLeft } = require('web3-utils');
const sinon = require('sinon');

const bn128 = require('../../bn128/bn128');
const proof = require('../../proof/proof');
const extractor = require('../../proof/extractor');
const proofHelpers = require('../../proof/helpers');
const { K_MAX } = require('../../params');

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

/**
 * Extractor test.
 *
 * What is the purpose of this test? The AZTEC zero-knowledge proof is a specially sound sigma protocol.
 * If a prover is capable of satisfying the verifier with two proofs over the *same* input string,
 * but with *different* challenges, there should exist an extractor algorithm that can
 * recover the witnesses from the proof transcript.
 * i.e. if you can satisfy the verifier in this way, an observer can extract the witnesses that prove the proof statement,
 * therefore the proof must be an honest proof.
 * So, we might as well verify that this is the case for our implementation.
 *
 * We stub proof.computeChallenge with a 'random oracle' - something that spits out random challenges instead of using hashes.
 * We also stub proof.generateBlindingScalars with a function that always returns the same set of blinding scalars.
 * This ensures that when we call proof.constructJoinSplit two times, with the same notes, we have the same input string
 * for both proofs.
 *
 * Finally, once we have our two proof transcripts we call extractor.extractWitness
 * and validate that we have indeed recovered the witnesses.
 *
 * N.B. This is also why re-using blinding scalars for multiple proofs leaks secrets, so don't try this at home, or in production.
 */
describe('AZTEC extractor tests', () => {
    let blindingScalars;
    let nIn;
    let nOut;
    let generateBlindingScalars;
    let computeChallenge;
    beforeEach(() => {
        nIn = 5;
        nOut = 5;
        blindingScalars = proof.generateBlindingScalars(nIn + nOut, nIn);

        // We want a satisfying proof over the same input string, so we want the same set of blinding scalars.
        // Stub proof.generateBlindingScalars to always return the same set of scalars.
        generateBlindingScalars = sinon.stub(proof, 'generateBlindingScalars').callsFake(() => blindingScalars);

        // It's a random oracle! ...sort of, if you squint a bit.
        computeChallenge = sinon.stub(proof, 'computeChallenge').callsFake(() => {
            return new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
        });
    });

    afterEach(() => {
        generateBlindingScalars.restore();
        computeChallenge.restore();
    });

    it('extractor can extract witnesses from two satisfying proofs over the same input string in the random oracle model', () => {
        const kIn = [...Array(nIn)].map(() => generateNoteValue());
        const kOut = [...Array(nOut)].map(() => generateNoteValue());
        const { commitments, m } = proofHelpers.generateFakeCommitmentSet({ kIn, kOut });
        const kPublic = getKPublic(kIn, kOut);
        const sender = randomAddress();

        // construct first proof
        const {
            proofData: firstTranscript,
            challenge: firstChallenge,
        } = proof.constructJoinSplit(commitments, m, sender, kPublic);

        // and now let's get a second proof over the same input string
        const {
            proofData: secondTranscript,
            challenge: secondChallenge,
        } = proof.constructJoinSplit(commitments, m, sender, kPublic);

        const witnesses = extractor.extractWitness(
            [firstTranscript, secondTranscript],
            m,
            [firstChallenge, secondChallenge]
        );

        // validate that the extractor has extracted the correct witnesses
        witnesses.forEach(({
            gamma,
            sigma,
            k,
            a,
        }) => {
            expect(gamma.mul(k).add(bn128.h.mul(a)).eq(sigma)).to.equal(true);
        });
    });
});
