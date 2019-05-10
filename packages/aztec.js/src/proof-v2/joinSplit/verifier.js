const { errors } = require('@aztec/dev-utils');
const BN = require('bn.js');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const Verifier = require('../verifier');

const { groupReduction } = bn128;
class JoinSplitVerifier extends Verifier {
    /**
     * Verify an AZTEC zero-knowledge proof
     */
    verifyProof() {
        const finalHash = new Keccak();
        finalHash.appendBN(this.proof.sender.slice(2));
        finalHash.appendBN(this.publicValue);
        finalHash.appendBN(this.proof.m);
        finalHash.appendBN(this.proof.publicOwner.slice(2));
        finalHash.data = [...finalHash.data, ...this.rollingHash.data];

        let pairingGammas;
        let pairingSigmas;
        // the "x" in the white paper
        let reducer;

        this.notes.forEach((note, i) => {
            let { kBar, aBar } = note;
            let c = this.challenge;
            if (i >= this.proof.m) {
                reducer = this.rollingHash.keccak(groupReduction);
                kBar = kBar.redMul(reducer);
                aBar = aBar.redMul(reducer);
                c = this.challenge.redMul(reducer);
            }
            const sigma = note.sigma.mul(c).neg();
            const B = note.gamma
                .mul(kBar)
                .add(bn128.h.mul(aBar))
                .add(sigma);
            if (i === this.proof.m) {
                pairingGammas = note.gamma;
                pairingSigmas = note.sigma.neg();
            } else if (i > this.proof.m) {
                pairingGammas = pairingGammas.add(note.gamma.mul(c));
                pairingSigmas = pairingSigmas.add(sigma);
            }
            if (B.isInfinity()) {
                this.errors.push(errors.codes.BAD_BLINDING_FACTOR);
                finalHash.appendBN(new BN(0));
                finalHash.appendBN(new BN(0));
            } else if (B.x.fromRed().eq(new BN(0)) && B.y.fromRed().eq(new BN(0))) {
                this.errors.push(errors.codes.BAD_BLINDING_FACTOR);
                finalHash.append(B);
            } else {
                finalHash.append(B);
            }
        });

        const challengeResponse = finalHash.keccak(groupReduction);
        if (!challengeResponse.fromRed().eq(this.challenge.fromRed())) {
            this.errors.push(errors.codes.CHALLENGE_RESPONSE_FAIL);
        }
        return { pairingGammas, pairingSigmas };
    }
}

module.exports = JoinSplitVerifier;
