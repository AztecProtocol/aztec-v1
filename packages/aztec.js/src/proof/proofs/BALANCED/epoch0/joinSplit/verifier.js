import * as bn128 from '@aztec/bn128';
import { constants, errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import Keccak from '../../../../../keccak';
import Verifier from '../../../../base/epoch0/verifier';

const { ZERO_BN } = constants;

class JoinSplitVerifier65793 extends Verifier {
    extractData() {
        this.data = [];
        const dataLength = this.proof.data.length;
        const inputDataLength = this.proof.m;

        let kBarAux = bn128.zeroBnRed.redSub(this.publicValue.redMul(this.challenge));
        this.data = this.proof.data.map((item, i) => {
            let kBar;
            if (i < dataLength - 1) {
                kBar = this.hexToGroupScalar(item[0]);
                if (i < inputDataLength) {
                    kBarAux = kBarAux.redAdd(kBar);
                } else {
                    kBarAux = kBarAux.redSub(kBar);
                }
            } else {
                if (inputDataLength !== dataLength) {
                    kBar = kBarAux;
                } else {
                    kBar = bn128.zeroBnRed.redSub(kBarAux);
                }
                if (kBar.fromRed().eq(bn128.zeroBnRed)) {
                    this.errors.push(errors.codes.SCALAR_IS_ZERO);
                }
            }
            return {
                kBar,
                aBar: this.hexToGroupScalar(item[1]),
                gamma: this.hexToGroupPoint(item[2], item[3]),
                sigma: this.hexToGroupPoint(item[4], item[5]),
            };
        });
    }

    verifyProof() {
        const rollingHash = new Keccak();
        this.data.forEach((item) => {
            rollingHash.appendPoint(item.gamma);
            rollingHash.appendPoint(item.sigma);
        });

        const challengeResponse = new Keccak();
        challengeResponse.appendBN(this.proof.sender.slice(2));
        challengeResponse.appendBN(this.publicValue);
        challengeResponse.appendBN(this.proof.m);
        challengeResponse.appendBN(this.proof.publicOwner.slice(2));
        challengeResponse.data = [...challengeResponse.data, ...rollingHash.data];

        let pairingGammas;
        let pairingSigmas;
        const reducer = rollingHash.redKeccak();
        this.data.forEach((item, i) => {
            let { kBar, aBar } = item;
            let c = this.challenge;
            if (i >= this.proof.m) {
                // the reducer is the "x" in the white paper
                const x = reducer.redPow(new BN(i + 1));
                kBar = kBar.redMul(x);
                aBar = aBar.redMul(x);
                c = this.challenge.redMul(x);
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
                if (blindingFactor.x.fromRed().eq(bn128.zeroBnRed) && blindingFactor.y.fromRed().eq(bn128.zeroBnRed)) {
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

export default JoinSplitVerifier65793;
