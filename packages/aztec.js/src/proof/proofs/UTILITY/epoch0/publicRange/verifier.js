/* eslint-disable prefer-destructuring */
import * as bn128 from '@aztec/bn128';

import { constants, errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import Keccak from '../../../../../keccak';
import Verifier from '../../../../base/epoch0/verifier';

const { ZERO_BN } = constants;

class PublicRangeVerifier66563 extends Verifier {
    verifyProof() {
        const dataLength = this.proof.data.length;
        if (dataLength < 2) {
            this.errors.push(errors.codes.INCORRECT_NOTE_NUMBER);
        }

        const challengeResponse = new Keccak();
        challengeResponse.appendBN(this.proof.sender.slice(2));
        challengeResponse.appendBN(new BN(this.proof.publicComparison));
        challengeResponse.appendBN(new BN(this.proof.publicValue));
        challengeResponse.appendBN(new BN(this.proof.publicOwner.slice(2), 16));

        const rollingHash = new Keccak();
        this.data.forEach((item) => {
            rollingHash.appendPoint(item.gamma);
            rollingHash.appendPoint(item.sigma);
        });

        challengeResponse.data = [...challengeResponse.data, ...rollingHash.data];

        let B;
        const reducer = rollingHash.redKeccak();
        this.data.forEach((note, i) => {
            let kBar;
            const { aBar, gamma, sigma } = note;

            if (i === 0) {
                kBar = note.kBar;

                B = gamma
                    .mul(kBar)
                    .add(bn128.h.mul(aBar))
                    .add(sigma.mul(this.challenge).neg());
            }

            if (i === 1) {
                let kBarX;
                const firstTerm = this.data[0].kBar;
                const secondTerm = this.challenge.mul(this.proof.publicComparison);
                kBar = firstTerm.sub(secondTerm);
                const x = reducer.redPow(new BN(i + 1));

                // multiplication in reduction context only works for positive numbers
                // So, have to check if kBar is negative and if it is, negate it (to make positive),
                // perform the operation and then negate back

                if (kBar < 0) {
                    kBar = kBar.neg();
                    kBarX = kBar.redMul(x).neg();
                } else {
                    kBarX = kBar.redMul(x);
                }

                const challengeX = this.challenge.redMul(x);
                const aBarX = aBar.redMul(x);

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
                if (B.x.fromRed().eq(bn128.zeroBnRed) && B.y.fromRed().eq(bn128.zeroBnRed)) {
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

export default PublicRangeVerifier66563;
