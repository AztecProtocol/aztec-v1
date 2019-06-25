/* eslint-disable prefer-destructuring */
const { constants, errors } = require('@aztec/dev-utils');
const { padLeft } = require('web3-utils');

const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const Verifier = require('../verifier');

const { BN128_GROUP_REDUCTION, K_MAX, ZERO_BN, ZERO_BN_RED } = constants;

class PrivateRangeVerifier extends Verifier {
    verifyProof() {

        // console.log('this.data in verifier: ', this.data);
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

        let reducer;
        let challengeX;
        this.data.forEach((item, i) => {
            const { gamma, sigma } = item;
            let { kBar, aBar } = item;
            let B;

            if (i === 0) {
                B = gamma
                    .mul(kBar)
                    .add(bn128.h.mul(aBar))
                    .add(sigma.mul(this.challenge).neg());
                console.log('i: ', i, 'B.x: ', B.x.toString());
            }

            if (i === 1) {
                reducer = rollingHash.redKeccak();
                const kBarX = kBar.redMul(reducer);
                const aBarX = aBar.redMul(reducer);
                challengeX = this.challenge.redMul(reducer);

                B = gamma
                    .mul(kBarX)
                    .add(bn128.h.mul(aBarX))
                    .add(sigma.mul(challengeX).neg());
                console.log('i: ', i, 'B.x: ', B.x.toString());
            }

            if (i === 2) {
                reducer = rollingHash.redKeccak();
                // console.log('reducer: ', reducer);
                const kBarX = ((this.data[0]).kBar).redAdd((this.data[1]).kBar).redMul(reducer);
                const aBarX = aBar.redMul(reducer);
                challengeX = challengeX.redMul(reducer);
                // console.log('gamma: ', gamma);


                B = gamma
                    .mul(kBarX)
                    .add(bn128.h.mul(aBarX))
                    .add(sigma.mul(challengeX).neg());
                console.log('i: ', i, 'B.x: ', B.x.toString());
                console.log('i: ', i, 'B.x: ', B.x.fromRed().toString((16), 64));
                console.log('i: ', i, 'B.y: ', B.y.fromRed().toString((16), 64));

                // console.log('B: ', B);
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

        // console.log('proof verification challenge hash: ', challengeResponse);
        // console.log('challenge response hash: ', challengeResponse);
        console.log('recovered challenge: ', challengeResponse.redKeccak().fromRed().toString());
        console.log('original challenge: ', this.challenge.fromRed().toString());
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
