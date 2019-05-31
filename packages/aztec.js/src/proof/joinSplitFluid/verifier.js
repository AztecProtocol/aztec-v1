const { constants, errors } = require('@aztec/dev-utils');
const JoinSplitVerifier = require('../joinSplit/verifier');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');

const { ZERO_BN, ZERO_BN_RED } = constants;

class JoinSplitFluidVerifier extends JoinSplitVerifier {
    /**
     * We may remove this function in the future and let the upper JoinSplitProof class handle the verification.
     * In the interim, we need it because the join split fluid validator doesn't expect the public owner
     * in the challenge.
     */
    verifyProof() {
        const dataLength = this.proof.data.length;
        if (dataLength < 2) {
            this.errors.push(errors.codes.INCORRECT_NOTE_NUMBER);
        }

        const rollingHash = new Keccak();
        this.data.forEach((item) => {
            rollingHash.appendPoint(item.gamma);
            rollingHash.appendPoint(item.sigma);
        });

        const challengeResponse = new Keccak();
        challengeResponse.appendBN(this.proof.sender.slice(2));
        challengeResponse.appendBN(this.publicValue);
        challengeResponse.appendBN(this.proof.m);
        challengeResponse.data = [...challengeResponse.data, ...rollingHash.data];

        let pairingGammas;
        let pairingSigmas;
        let reducer = ZERO_BN_RED;
        this.data.forEach((item, i) => {
            let { kBar, aBar } = item;
            let c = this.challenge;
            if (i >= this.proof.m) {
                // the reducer is the "x" in the white paper
                reducer = rollingHash.redKeccak();
                kBar = kBar.redMul(reducer);
                aBar = aBar.redMul(reducer);
                c = this.challenge.redMul(reducer);
            }
            const gamma = item.gamma.mul(c);
            const sigma = item.sigma.mul(c).neg();
            const blindingFactor = item.gamma
                .mul(kBar)
                .add(bn128.h.mul(aBar))
                .add(sigma);
            if (i === this.proof.m) {
                pairingGammas = item.gamma;
                pairingSigmas = item.sigma.neg();
            } else if (i > this.proof.m) {
                pairingGammas = pairingGammas.add(gamma);
                pairingSigmas = pairingSigmas.add(sigma);
            }

            if (blindingFactor.isInfinity()) {
                challengeResponse.appendBN(ZERO_BN);
                challengeResponse.appendBN(ZERO_BN);
                this.errors.push(errors.codes.BAD_BLINDING_FACTOR);
            } else {
                challengeResponse.appendPoint(blindingFactor);
                if (blindingFactor.x.fromRed().eq(ZERO_BN_RED) && blindingFactor.y.fromRed().eq(ZERO_BN_RED)) {
                    this.errors.push(errors.codes.BAD_BLINDING_FACTOR);
                }
            }
        });

        if (
            !challengeResponse
                .redKeccak()
                .fromRed()
                .eq(this.challenge.fromRed())
        ) {
            this.errors.push(errors.codes.CHALLENGE_RESPONSE_FAIL);
        }
        return { pairingGammas, pairingSigmas };
    }
}

module.exports = JoinSplitFluidVerifier;
