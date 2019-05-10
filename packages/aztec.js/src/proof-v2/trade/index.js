const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const crypto = require('crypto');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../abiEncoder');
const bn128 = require('../../bn128');
const { Proof, ProofType } = require('../proof');

class TradeProof extends Proof {
    constructor(inputNotes, outputNotes, sender) {
        const publicValue = new BN(0);
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.TRADE.name, inputNotes, outputNotes, sender, publicValue, publicOwner);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutput();
    }

    /**
     * Construct blinding factors
     *
     * - The purpose is to set bk1 = bk3 and bk2 = bk4
     * - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
     * - All bks are stored in a bkArray. When we arrive at the taker notes, we set bk equal to the bk of
     *   the corresponding maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the
     *   bkArray, and setting the current bk equal to the element at the resulting position.
     */
    constructBlindingFactors() {
        const bkArray = [];

        this.blindingFactors = this.notes.map((note, i) => {
            let bk = bn128.randomGroupScalar();
            const ba = bn128.randomGroupScalar();
            let B;

            if (i <= 1) {
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            } else {
                // taker notes
                bk = bkArray[i - 2];
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            }
            bkArray.push(bk);

            return { bk, ba, B };
        });
    }

    constructData() {
        this.data = this.blindingFactors.map((blindingFactor, i) => {
            const note = this.notes[i];
            let kBar;

            // Only set the first 2 values of kBar - the third and fourth are later inferred
            // from a cryptographic relation (this is why the the third and fourth to random values,
            // leaving them zeroed or null-ed produces an error).
            if (i <= 1) {
                kBar = note.k
                    .redMul(this.challenge)
                    .redAdd(blindingFactor.bk)
                    .fromRed();
            } else {
                kBar = padLeft(new BN(crypto.randomBytes(32), 16).umod(bn128.curve.n).toString(16), 64);
            }

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
        this.output = `0x${outputCoder.encodeProofOutputs([
            {
                inputNotes: [this.inputNotes[0]],
                outputNotes: [this.outputNotes[0]],
                publicOwner: this.publicOwner,
                publicValue: this.publicValue,
                challenge: this.challengeHex,
            },
            {
                inputNotes: [this.outputNotes[1]],
                outputNotes: [this.inputNotes[1]],
                publicOwner: this.publicOwner,
                publicValue: this.publicValue,
                challenge: `0x${padLeft(keccak256(this.challengeHex).slice(2), 64)}`,
            },
        ])}`;
        this.hash = outputCoder.hashProofOutput(this.output);
    }

    encodeABI() {
        const data = inputCoder.trade(this.data, this.challenge, this.inputNoteOwners, [this.outputNotes[0], this.inputNotes[1]]);
        return data;
    }
}

module.exports = TradeProof;
