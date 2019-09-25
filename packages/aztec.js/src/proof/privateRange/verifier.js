/* eslint-disable prefer-destructuring */
const bn128 = require('@aztec/bn128');
const BN = require('bn.js');
const { constants, errors } = require('@aztec/dev-utils');

const Keccak = require('../../keccak');
const Verifier = require('../verifier');

const { ZERO_BN } = constants;

class PrivateRangeVerifier extends Verifier {
    verifyProof() {
        const dataLength = this.proof.data.length;
        if (dataLength < 3) {
            this.errors.push(errors.codes.INCORRECT_NOTE_NUMBER);
        }

        const challengeResponse = new Keccak();
        challengeResponse.appendBN(this.proof.sender.slice(2));
        challengeResponse.appendBN(this.proof.publicValue);
        challengeResponse.appendBN(this.proof.publicOwner.slice(2));

        const rollingHash = new Keccak();
        this.data.forEach((item) => {
            rollingHash.appendPoint(item.gamma);
            rollingHash.appendPoint(item.sigma);
        });
        challengeResponse.data.push(...rollingHash.data);

        const reducer = rollingHash.redKeccak();
        let challengeX;
        this.data.forEach((item, i) => {
            const { gamma, sigma } = item;
            const { kBar, aBar } = item;
            let B;

            if (i === 0) {
                B = gamma
                    .mul(kBar)
                    .add(bn128.h.mul(aBar))
                    .add(sigma.mul(this.challenge).neg());
            }

            if (i === 1) {
                const x = reducer.redPow(new BN(i + 1));
                const kBarX = kBar.redMul(x);
                const aBarX = aBar.redMul(x);
                challengeX = this.challenge.redMul(x);

                B = gamma
                    .mul(kBarX)
                    .add(bn128.h.mul(aBarX))
                    .add(sigma.mul(challengeX).neg());
            }

            if (i === 2) {
                const x = reducer.redPow(new BN(i + 1));
                const kBarX = this.data[0].kBar.redSub(this.data[1].kBar).redMul(x);
                const aBarX = aBar.redMul(x);
                challengeX = this.challenge.redMul(x);

                B = gamma
                    .mul(kBarX)
                    .add(bn128.h.mul(aBarX))
                    .add(sigma.mul(challengeX).neg());
            }

            if (B.isInfinity()) {
                challengeResponse.appendBN(ZERO_BN);
                challengeResponse.appendBN(ZERO_BN);
                this.errors.push(errors.codes.BAD_BLINDING_FACTOR);
            } else {
                challengeResponse.appendPoint(B);
                if (B.x.fromRed().eq(ZERO_BN) && B.y.fromRed().eq(ZERO_BN)) {
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

module.exports = PrivateRangeVerifier;
