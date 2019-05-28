/* eslint-disable prefer-destructuring */
const { constants, errors } = require('@aztec/dev-utils');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const Verifier = require('../verifier');

const { ZERO_BN, ZERO_BN_RED } = constants;

class SwapVerifier extends Verifier {
    verifyProof() {
        const dataLength = this.proof.data.length;
        if (dataLength < 4) {
            this.errors.push(errors.codes.INCORRECT_NOTE_NUMBER);
        }

        const rollingHash = new Keccak();
        this.data.forEach((note) => {
            rollingHash.appendPoint(note.gamma);
            rollingHash.appendPoint(note.sigma);
        });

        const challengeResponse = new Keccak();
        challengeResponse.appendBN(this.proof.sender.slice(2));
        challengeResponse.data = [...challengeResponse.data, ...rollingHash.data];

        this.data.forEach((note, i) => {
            let kBar;
            const { aBar, gamma, sigma } = note;

            if (i <= 1) {
                kBar = note.kBar;
            } else {
                kBar = this.data[i - 2].kBar;
            }

            const B = gamma
                .mul(kBar)
                .add(bn128.h.mul(aBar))
                .add(sigma.mul(this.challenge).neg());

            if (B.isInfinity()) {
                challengeResponse.appendBN(ZERO_BN);
                challengeResponse.appendBN(ZERO_BN);
                this.errors.push(errors.codes.BAD_BLINDING_FACTOR);
            } else {
                challengeResponse.appendPoint(B);
                if (B.x.fromRed().eq(ZERO_BN_RED) && B.y.fromRed().eq(ZERO_BN_RED)) {
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
    }
}

module.exports = SwapVerifier;
