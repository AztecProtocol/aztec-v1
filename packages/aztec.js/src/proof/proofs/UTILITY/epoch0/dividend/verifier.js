/* eslint-disable prefer-destructuring */
import * as bn128 from '@aztec/bn128';

import { constants, errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import Keccak from '../../../../../keccak';
import Verifier from '../../../../base/epoch0/verifier';

const { K_MAX, ZERO_BN } = constants;

class DividendVerifier66561 extends Verifier {
    verifyProof() {
        const dataLength = this.proof.data.length;
        if (dataLength < 3) {
            this.errors.push(errors.codes.INCORRECT_NOTE_NUMBER);
        }

        const kMaxBN = new BN(K_MAX);
        if (this.proof.za.gte(kMaxBN)) {
            this.errors.push(errors.codes.ZA_TOO_BIG);
        }
        if (this.proof.zb.gte(kMaxBN)) {
            this.errors.push(errors.codes.ZB_TOO_BIG);
        }

        const challengeResponse = new Keccak();
        challengeResponse.appendBN(this.proof.sender.slice(2));
        challengeResponse.appendBN(this.proof.za);
        challengeResponse.appendBN(this.proof.zb);

        const rollingHash = new Keccak();
        this.data.forEach((item) => {
            rollingHash.appendPoint(item.gamma);
            rollingHash.appendPoint(item.sigma);
        });

        challengeResponse.data.push(...rollingHash.data);

        const reducer = rollingHash.redKeccak(); // "x" in the white paper
        this.data.forEach((item, i) => {
            const x = reducer.redPow(new BN(i + 1));

            const { aBar, gamma, sigma } = item;
            let challengeX = this.challenge.mul(x);
            let kBar = item.kBar;

            // Notional and target notes
            if (i === 2) {
                challengeX = this.challenge.redMul(x);
                const zaRed = this.proof.za.toRed(bn128.groupReduction);
                const zbRed = this.proof.zb.toRed(bn128.groupReduction);

                // kBar_3 = (z_b)(kBar_1) - (z_a)(kBar_2)
                kBar = zbRed.redMul(this.data[0].kBar).redSub(zaRed.redMul(this.data[1].kBar));
            }

            const kBarX = kBar.redMul(x); // xbk = bk*x
            const aBarX = aBar.redMul(x); // xba = ba*x
            const B = gamma
                .mul(kBarX)
                .add(bn128.h.mul(aBarX))
                .add(sigma.mul(challengeX).neg());

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

export default DividendVerifier66561;
