const { constants, errors } = require('@aztec/dev-utils');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../abiEncoder');
const JoinSplitProof = require('../joinSplit');
const { ProofType } = require('../proof');

const { AztecError } = errors;

class JoinSplitFluidProof extends JoinSplitProof {
    constructor(type, currentTotalValueNote, newTotalValueNote, mintedNotes, sender) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super([newTotalValueNote], [currentTotalValueNote, ...mintedNotes], sender, publicValue, publicOwner);

        if (type !== ProofType.BURN.name && type !== ProofType.MINT.name) {
            throw new Error(`proof type should be one of ${[ProofType.BURN.name, ProofType.MINT.name]}`);
        }
        this.type = type;
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
                publicOwner: this.publicOwner,
                publicValue: this.publicValue,
                challenge: this.challengeHex,
            },
            {
                inputNotes: [],
                outputNotes: this.outputNotes.slice(1),
                publicOwner: this.publicOwner,
                publicValue: this.publicValue,
                challenge: `0x${padLeft(keccak256(this.challengeHex).slice(2), 64)}`, // TODO: figure out why this is the challenge hex and not the note the challenge itself
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.output);
    }

    /**
     * Encode the mint proof as data for an Ethereum transaction
     * @returns {Object} AZTEC proof data
     */
    encodeABI() {
        const data = inputCoder.joinSplitFluid(
            this.data,
            this.challenge,
            this.inputNoteOwners,
            this.outputNoteOwners,
            this.outputNotes,
        );
        return data;
    }

    validateInputs() {
        super.validateInputs();
        const numNotes = this.notes.length;
        if (numNotes < 2) {
            throw new AztecError(errors.codes.INCORRECT_NOTE_NUMBER, {
                message: `There are less than 2 notes, this is not possible in a ${this.type} proof`,
                numNotes,
            });
        }
    }
}

module.exports = JoinSplitFluidProof;
