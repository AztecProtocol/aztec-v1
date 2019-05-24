/* eslint-disable prefer-destructuring */
const { constants, errors } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { keccak256, padLeft, randomHex } = require('web3-utils');

const { encoder } = require('../../abiCoder');
const { outputCoder } = require('../../abiEncoder');
const bn128 = require('../../bn128');
const { Proof, ProofType } = require('../proof');

const { AztecError } = errors;

class SwapProof extends Proof {
    constructor(inputNotes, outputNotes, sender, metadata = [outputNotes[0], inputNotes[1]]) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.SWAP.name, inputNotes, outputNotes, sender, publicValue, publicOwner, metadata);

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
        const blindingScalars = Array(this.notes.length)
            .fill()
            .map(() => {
                return {
                    bk: bn128.randomGroupScalar(),
                    ba: bn128.randomGroupScalar(),
                };
            });

        this.blindingFactors = this.notes.map(({ gamma }, i) => {
            let { bk } = blindingScalars[i];
            const { ba } = blindingScalars[i];

            // Taker notes
            if (i > 1) {
                bk = blindingScalars[i - 2].bk;
            }

            const B = gamma.mul(bk).add(bn128.h.mul(ba));
            return { B, ba, bk };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([this.sender, this.notes, this.blindingFactors]);
        this.challenge = this.challengeHash.redKeccak();
    }

    constructData() {
        this.data = this.blindingFactors.map(({ bk, ba }, i) => {
            const note = this.notes[i];
            let kBar;

            // Only set the first 2 values of kBar - the third and fourth are later inferred
            // from a cryptographic relation (this is why set the the third and fourth to random values,
            // leaving them zeroed or null-ed produces an error).
            if (i <= 1) {
                kBar = note.k
                    .redMul(this.challenge)
                    .redAdd(bk)
                    .fromRed();
            } else {
                kBar = new BN(randomHex(32), 16).umod(bn128.curve.n).toString(16);
            }

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
                inputNotes: [this.inputNotes[0]],
                outputNotes: [this.outputNotes[0]],
                publicValue: this.publicValue,
                publicOwner: this.publicOwner,
                challenge: this.challengeHex,
            },
            {
                inputNotes: [this.outputNotes[1]],
                outputNotes: [this.inputNotes[1]],
                publicValue: this.publicValue,
                publicOwner: this.publicOwner,
                challenge: `0x${keccak256(this.challengeHex).slice(2)}`,
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.output);
    }

    encodeABI() {
        const encodedParams = [
            encoder.encodeProofData(this.data),
            encoder.encodeOwners([...this.inputNoteOwners, ...this.outputNoteOwners]),
            encoder.encodeMetadata(this.metadata),
        ];

        const length = 1 + encodedParams.length + 1;
        const { offsets } = encodedParams.reduce(
            (acc, encodedParameter) => {
                acc.offsets.push(padLeft(acc.offset.toString(16), 64));
                acc.offset += encodedParameter.length / 2;
                return acc;
            },
            {
                offset: length * 32,
                offsets: [],
            },
        );

        const abiEncodedParams = [this.challengeHex.slice(2), ...offsets, ...encodedParams];
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }

    validateInputs() {
        super.validateInputs();
        if (this.notes.length !== 4) {
            throw new AztecError(errors.codes.INCORRECT_NOTE_NUMBER, {
                message: `Swap proofs must contain 4 notes`,
                numNotes: this.notes.length,
            });
        }
    }
}

module.exports = SwapProof;
