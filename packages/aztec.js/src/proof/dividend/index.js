const { constants, errors } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { padLeft } = require('web3-utils');

const bn128 = require('../../bn128');
const { inputCoder, outputCoder } = require('../../encoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');

const { AztecError } = errors;
const { BN128_GROUP_REDUCTION } = constants;

class DividendProof extends Proof {
    constructor(notionalNote, residualNote, targetNote, sender, za, zb, metadata = [residualNote, targetNote]) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.DIVIDEND.name, [notionalNote], [residualNote, targetNote], sender, publicValue, publicOwner, metadata);

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

        let reducer = this.rollingHash.redKeccak(); // "x" in the white paper
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
            reducer = this.rollingHash.redKeccak();
            return { B, bk, ba };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([this.sender, this.za, this.zb, this.notes, this.blindingFactors]);
        this.challenge = this.challengeHash.redKeccak();
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
    }

    constructOutput() {
        this.output = outputCoder.encodeProofOutputs([
            {
                inputNotes: this.inputNotes,
                outputNotes: this.outputNotes,
                publicValue: this.publicValue,
                publicOwner: this.publicOwner,
                challenge: this.challengeHex,
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.output);
    }

    encodeABI() {
        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners(this.inputNoteOwners),
            inputCoder.encodeOwners(this.outputNoteOwners),
            inputCoder.encodeMetadata(this.metadata),
        ];

        const length = 3 + encodedParams.length + 1;
        const offsets = ProofUtils.getOffsets(length, encodedParams);
        const abiEncodedParams = [
            this.challengeHex.slice(2),
            padLeft(this.za.toString(16), 64),
            padLeft(this.zb.toString(16), 64),
            ...offsets,
            ...encodedParams,
        ];
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }

    validateInputs() {
        super.validateInputs();
        if (this.notes.length !== 3) {
            throw new AztecError(errors.codes.INCORRECT_NOTE_NUMBER, {
                message: `Dividend proofs must contain 3 notes`,
                numNotes: this.notes.length,
            });
        }
    }
}

module.exports = DividendProof;
