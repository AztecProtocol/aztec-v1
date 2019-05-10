const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const { inputCoder } = require('../../abiEncoder');
const bn128 = require('../../bn128');
const Keccak = require('../../keccak');
const { Proof, ProofType } = require('../proof');

const { groupReduction } = bn128;

class DividendProof extends Proof {
    constructor(notionalNote, targetNote, residualNote, sender, za, zb) {
        const publicValue = new BN(0);
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.DIVIDEND.name, [notionalNote], [targetNote, residualNote], sender, publicValue, publicOwner);

        this.za = new BN(za);
        this.zb = new BN(zb);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutput();
    }

    constructBlindingFactors() {
        const bkArray = [];
        let x = this.rollingHash.keccak(groupReduction);

        this.blindingFactors = this.notes.map((note, i) => {
            let bk = bn128.randomGroupScalar();
            const ba = bn128.randomGroupScalar();
            let B;

            // Calculating the blinding factors
            if (i === 0) {
                // input note
                const xbk = bk.redMul(x); // xbk = bk*x
                const xba = ba.redMul(x); // xba = ba*x
                x = this.rollingHash.keccak(groupReduction);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
                bkArray.push(bk);
            }

            if (i === 1) {
                // output note
                const xba = ba.redMul(x); // xba = ba*x
                const xbk = bk.redMul(x); // xbk = bk*x
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
                x = this.rollingHash.keccak(groupReduction);
                bkArray.push(bk);
            }

            if (i === 2) {
                // residual note
                const zaRed = this.za.toRed(groupReduction);
                const zbRed = this.zb.toRed(groupReduction);

                // bk_3 = (z_b)(bk_1) - (z_a)(bk_2)
                bk = zbRed.redMul(bkArray[0]).redSub(zaRed.redMul(bkArray[1]));

                const xbk = bk.redMul(x); // xbk = bk*x
                const xba = ba.redMul(x); // xba = ba*x

                x = this.rollingHash.keccak(groupReduction);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
                bkArray.push(bk);
            }

            return { bk, ba, B };
        });
    }

    constructChallenge() {
        this.challengeHash = new Keccak();
        this.constructChallengeRecurse([this.sender, this.za, this.zb, this.publicOwner, this.notes, this.blindingFactors]);
        this.challenge = this.challengeHash.keccak(groupReduction);
    }

    constructData() {
        this.data = this.blindingFactors.map((blindingFactor, i) => {
            const note = this.notes[i];
            const kBar = note.k
                .redMul(this.challenge)
                .redAdd(blindingFactor.bk)
                .fromRed();
            const aBar = note.a
                .redMul(this.challenge)
                .redAdd(blindingFactor.ba)
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
