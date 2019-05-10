const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../abiEncoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');

class JoinSplitFluidProof extends Proof {
    constructor(type, currentTotalValueNote, newTotalValueNote, mintedNotes, sender) {
        if (type !== ProofType.BURN.name && type !== ProofType.MINT.name) {
            throw new Error(`proof type should be one of ${[ProofType.BURN.name, ProofType.MINT.name]}`);
        }
        if (!ProofUtils.isEthereumAddress(sender)) {
            throw new Error('sender is not an Ethereum address');
        }
        const publicValue = new BN(0);
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(type, [newTotalValueNote], [currentTotalValueNote, ...mintedNotes], sender, publicValue, publicOwner);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutput();
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
}

module.exports = JoinSplitFluidProof;
