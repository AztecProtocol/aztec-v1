const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../../src/abiEncoder');
const { Proof, ProofType } = require('../index');
const { ProofUtils } = require('../utils');

class MintProof extends Proof {
    constructor(totalValueNote, newTotalValueNote, mintedNotes, sender) {
        if (!ProofUtils.isEthereumAddress(sender)) {
            throw new Error('sender is not an Ethereum address');
        }
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        const kPublic = new BN(0);
        super(ProofType.MINT.name, [totalValueNote], [newTotalValueNote, ...mintedNotes], sender, publicOwner, kPublic);
    }

    constructData() {
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
                publicValue: this.kPublic,
                challenge: this.challenge,
            },
            {
                inputNotes: [],
                outputNotes: this.outputNotes.slice(1),
                publicOwner: this.publicOwner,
                publicValue: this.kPublic,
                challenge: `0x${padLeft(keccak256(this.challenge).slice(2), 64)}`, // TODO: figure out why this is the challenge hex and not the note the challenge itself
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.output);
    }

    /**
     * Encode the mint proof as data for an Ethereum transaction
     * @returns {Object} AZTEC proof data
     */
    encodeABI() {
        const data = inputCoder.mint(this.data, this.challenge, this.inputNoteOwners, this.outputNoteOwners, this.outputNotes);
        return data;
    }
}

module.exports = { MintProof };
