/* eslint-disable prefer-destructuring */
import * as bn128 from '@aztec/bn128';

import { constants, errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import Keccak from '../../../../../keccak';
import Verifier from '../../../../base/epoch0/verifier';

const { ZERO_BN } = constants;

class SwapVerifier65794 extends Verifier {
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

        const reducer = rollingHash.redKeccak();
        this.data.forEach((note, i) => {
            let aBar;
            let kBar;
            let c;
            const { gamma, sigma } = note;

            if (i === 0) {
                kBar = note.kBar;
                aBar = note.aBar;
                c = this.challenge;
            }

            if (i > 0) {
                const x = reducer.redPow(new BN(i + 1));
                kBar = note.kBar.redMul(x);
                aBar = note.aBar.redMul(x);

                if (i > 1) {
                    kBar = this.data[i - 2].kBar.redMul(x);
                }
                c = this.challenge.redMul(x);
            }

            const B = gamma
                .mul(kBar)
                .add(bn128.h.mul(aBar))
                .add(sigma.mul(c).neg());

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

export default SwapVerifier65794;
