const { constants, errors } = require('@aztec/dev-utils');
const { keccak256 } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../encoder');
const JoinSplitProof = require('../joinSplit');
const { ProofType } = require('../proof');
const ProofUtils = require('../utils');

const { AztecError } = errors;

class JoinSplitFluidProof extends JoinSplitProof {
    constructor(
        type,
        currentTotalValueNote,
        newTotalValueNote,
        adjustedNotes,
        sender,
        metadata = [currentTotalValueNote, ...adjustedNotes],
    ) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super([newTotalValueNote], [currentTotalValueNote, ...adjustedNotes], sender, publicValue, publicOwner, metadata);

        // Overriding this because JoinSplit sets the type to `JOIN_SPLIT`
        if (type !== ProofType.BURN.name && type !== ProofType.MINT.name) {
            throw new Error(`proof type should be one of ${[ProofType.BURN.name, ProofType.MINT.name]}`);
        }
        this.type = type;
    }

    /**
     * We may remove this function in the future and let the upper JoinSplitProof class handle
     * the challenge construction. In the interim, we need it because the join split fluid
     * validator doesn't expect the public owner in the challenge.
     */
    constructChallenge() {
        this.constructChallengeRecurse([this.sender, this.publicValue, this.m, this.notes, this.blindingFactors]);
        this.challenge = this.challengeHash.redKeccak();
    }

    constructOutput() {
        this.output = outputCoder.encodeProofOutputs([
            {
                inputNotes: [
                    {
                        ...this.outputNotes[0],
                        forceMetadata: true,
                    },
                ],
                outputNotes: [
                    {
                        ...this.inputNotes[0],
                        forceNoMetadata: true,
                    },
                ],
                publicValue: this.publicValue,
                publicOwner: this.publicOwner,
                challenge: this.challengeHex,
            },
            {
                inputNotes: [],
                outputNotes: this.outputNotes.slice(1),
                publicValue: this.publicValue,
                publicOwner: this.publicOwner,
                challenge: keccak256(this.challengeHex), // TODO: figure out why this is the challenge hex and not the note the challenge itself
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.output);
    }

    /**
     * Encode the mint proof as data for an Ethereum transaction
     * @returns {Object} AZTEC proof data
     */
    encodeABI() {
        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners(this.inputNoteOwners),
            inputCoder.encodeOwners(this.outputNoteOwners),
            inputCoder.encodeMetadata(this.metadata),
        ];

        const length = 1 + encodedParams.length + 1;
        const offsets = ProofUtils.getOffsets(length, encodedParams);
        const abiEncodedParams = [this.challengeHex.slice(2), ...offsets, ...encodedParams];
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }

    validateInputs() {
        super.validateInputs();
        if (this.notes.length < 2) {
            throw new AztecError(errors.codes.INCORRECT_NOTE_NUMBER, {
                message: `There are less than 2 notes, which is not allowed with ${this.type.name} proofs`,
                numNotes: this.notes.length,
            });
        }
    }
}

module.exports = JoinSplitFluidProof;
