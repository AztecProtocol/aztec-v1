const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const { inputCoder } = require('../../abiEncoder');
const bn128 = require('../../bn128');
const { Proof, ProofType } = require('../proof');

const { BN128_GROUP_REDUCTION } = constants;

class DividendProof extends Proof {
    constructor(notionalNote, residualNote, targetNote, sender, za, zb) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.DIVIDEND.name, [notionalNote], [residualNote, targetNote], sender, publicValue, publicOwner);

        this.za = new BN(za);
        this.zb = new BN(zb);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutput();
    }

    constructBlindingFactors() {
        const blindingScalars = Array(this.notes.length)
            .fill()
            .map(() => {
                return {
                    bk: bn128.randomGroupScalar(),
                    ba: bn128.randomGroupScalar(),
                };
            });

        let reducer = this.rollingHash.keccak(BN128_GROUP_REDUCTION); // "x" in the white paper
        this.blindingFactors = this.notes.map((note, i) => {
            let { bk } = blindingScalars[i];
            const { ba } = blindingScalars[i];

            if (i === 2) {
                const zaRed = this.za.toRed(BN128_GROUP_REDUCTION);
                const zbRed = this.zb.toRed(BN128_GROUP_REDUCTION);

                // bk_3 = (z_b)(bk_1) - (z_a)(bk_2)
                bk = zbRed.redMul(blindingScalars[0].bk).redSub(zaRed.redMul(blindingScalars[1].bk));
            }

            const xbk = bk.redMul(reducer); // xbk = bk*x
            const xba = ba.redMul(reducer); // xba = ba*x
            const B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            reducer = this.rollingHash.keccak(BN128_GROUP_REDUCTION);
            return { B, bk, ba };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([this.sender, this.za, this.zb, this.notes, this.blindingFactors]);
        this.challenge = this.challengeHash.keccak(BN128_GROUP_REDUCTION);
    }

    constructData() {
        this.data = this.blindingFactors.map(({ bk, ba }, i) => {
            const note = this.notes[i];
            const kBar = note.k
                .redMul(this.challenge)
                .redAdd(bk)
                .fromRed();
            const aBar = note.a
                .redMul(this.challenge)
                .redAdd(ba)
                .fromRed();

            const items = [
                kBar,
                aBar,
                note.gamma.x.fromRed(),
                note.gamma.y.fromRed(),
                note.sigma.x.fromRed(),
                note.sigma.y.fromRed(),
            ];
            return items.map((item) => `0x${padLeft(item.toString(16), 64)}`);
        });
        // console.log('Construction', this.data);
        // console.log('Construction Length', this.data.length);
    }

    constructOutput() {
        this.output = '';
    }

    encodeABI() {
        const data = inputCoder.dividend(
            this.data,
            this.challenge,
            this.za,
            this.zb,
            this.inputNoteOwners,
            this.outputNoteOwners,
            this.outputNotes,
        );
        return data;
    }
}

module.exports = DividendProof;
