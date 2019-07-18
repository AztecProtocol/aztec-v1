const bn128 = require('@aztec/bn128');
const { constants, proofs } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { AbiCoder } = require('web3-eth-abi');
const { keccak256, padLeft, randomHex } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../encoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');

class PrivateRangeProof extends Proof {
    /**
    Constructs a private range proof - proving that the value of one AZTEC note, the originalNote, is greater than 
    the value of a second AZTEC note, the comparisonNote. The balancing relationship satisfied is:

    originalNoteValue = comparisonNoteValue + utilityNoteValue

    @param {Note} originalNote note whose value is being compared against the comparisonNote
    @param {Note} comparisonNote note being compared against
    @param {Note} utilityNote helper note used to construct a balancing relationship in the proof. The value of this note must
                              be chosen to satisfy the equation: originalNoteValue = comparisonNoteValue + utilityNoteValue
    @param {string} sender Ethereum address of the transaction sender
    */
    constructor(originalNote, comparisonNote, utilityNote, sender) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.PRIVATE_RANGE.name, [originalNote, comparisonNote], [utilityNote], sender, publicValue, publicOwner, [
            utilityNote,
        ]);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutputs();
    }

    /**
     * Generate blinding factors based on the previous blinding scalars
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

        let B;

        let reducer;
        this.blindingFactors = this.notes.map((note, i) => {
            let { bk } = blindingScalars[i];
            const { ba } = blindingScalars[i];

            if (i === 0) {
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            }

            if (i === 1) {
                reducer = this.rollingHash.redKeccak();
                const xbk = bk.redMul(reducer);
                const xba = ba.redMul(reducer);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            }

            if (i === 2) {
                reducer = this.rollingHash.redKeccak();
                bk = blindingScalars[0].bk.redSub(blindingScalars[1].bk);

                const xbk = bk.redMul(reducer);
                const xba = ba.redMul(reducer);

                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            }
            return {
                B,
                bk,
                ba,
            };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([this.sender, this.publicValue, this.publicOwner, this.notes, this.blindingFactors]);
        this.challenge = this.challengeHash.redKeccak();
    }

    constructData() {
        this.data = this.blindingFactors.map(({ bk, ba }, i) => {
            const note = this.notes[i];
            let kBar;

            if (i < this.notes.length - 1) {
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

    // TODO: normalise proof output encoding. In some places it's expected to use `encodeProofOutputs`
    // while in others `encodeProofOutput`.
    constructOutputs() {
        const proofOutput = {
            inputNotes: this.inputNotes,
            outputNotes: this.outputNotes,
            publicValue: this.publicValue,
            publicOwner: this.publicOwner,
            challenge: this.challengeHex,
        };
        this.output = outputCoder.encodeProofOutput(proofOutput);
        this.outputs = outputCoder.encodeProofOutputs([proofOutput]);
        this.hash = outputCoder.hashProofOutput(this.output);

        this.validatedProofHash = keccak256(
            new AbiCoder().encodeParameters(
                ['bytes32', 'uint24', 'address'],
                [this.hash, proofs.PRIVATE_RANGE_PROOF, this.sender],
            ),
        );
    }

    /**
     * Encode the privateRange proof as data for an Ethereum transaction
     * @returns {Object} proof data and expected output
     */
    encodeABI() {
        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners(this.inputNoteOwners),
            inputCoder.encodeOwners(this.outputNoteOwners),
            inputCoder.encodeMetadata(this.metadata),
        ];

        // First hardcoded value in length calc is num of
        // elements prepending ...offsets in abiEncodedParams
        const length = 1 + encodedParams.length + 1;
        const offsets = ProofUtils.getOffsets(length, encodedParams);
        const abiEncodedParams = [this.challengeHex.slice(2), ...offsets, ...encodedParams];
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }
}

module.exports = PrivateRangeProof;
