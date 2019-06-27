const bn128 = require('@aztec/bn128');
const { constants, errors, proofs } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { AbiCoder } = require('web3-eth-abi');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../encoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');

const { AztecError } = errors;

class PublicRangeProof extends Proof {
    /**
     * Constructs a public range proof
     *
     * @param {Object} originalNote the note that one is computing a dividend of
     * @param {Object} publicComparison the note that represents the integer rounding error
     * @param {string} sender
     */
    constructor(originalNote, publicInteger, sender, isGreaterOrEqual, utilityNote) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.PUBLIC_RANGE.name, [originalNote], [utilityNote], sender, publicValue, publicOwner, [utilityNote]);
        this.publicInteger = new BN(publicInteger);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutputs();
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

        let B;
        this.blindingFactors = this.notes.map((note, i) => {
            const { bk } = blindingScalars[0]; // trivially true for i=0, and enforcing k1 = k2 for i=1
            const { ba } = blindingScalars[i];

            if (i === 0) {
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            }

            if (i === 1) {
                const reducer = this.rollingHash.redKeccak();
                const xbk = bk.redMul(reducer);
                const xba = ba.redMul(reducer);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            }
            return { bk, ba, B };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([
            this.sender,
            this.publicInteger,
            this.publicValue,
            this.publicOwner,
            this.notes,
            this.blindingFactors,
        ]);
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
                [this.hash, proofs.PUBLIC_RANGE_PROOF, this.sender],
            ),
        );
    }

    encodeABI() {
        // this still needs doing
        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners(this.inputNoteOwners),
            inputCoder.encodeOwners(this.outputNoteOwners),
            inputCoder.encodeMetadata(this.metadata),
        ];

        const length = 2 + encodedParams.length + 1; // what is the +3, +1 for?
        const offsets = ProofUtils.getOffsets(length, encodedParams);
        const abiEncodedParams = [
            this.challengeHex.slice(2),
            padLeft(Number(this.publicInteger).toString(16), 64),
            ...offsets,
            ...encodedParams,
        ];
        // console.log('abiEncodedParams: ', abiEncodedParams);
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }

    validateInputs() {
        super.validateInputs();
        if (this.notes.length !== 2) {
            throw new AztecError(errors.codes.INCORRECT_NOTE_NUMBER, {
                message: `Public range proofs must contain 2 notes`,
                numNotes: this.notes.length,
            });
        }
    }
}

module.exports = PublicRangeProof;
