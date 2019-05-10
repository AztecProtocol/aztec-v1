const { constants } = require('@aztec/dev-utils');

const { inputCoder, outputCoder } = require('../../../src/abiEncoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');
const signer = require('../../../src/signer');

class JoinSplitProof extends Proof {
    constructor(inputNotes, outputNotes, sender, publicValue, publicOwner) {
        super(ProofType.JOIN_SPLIT.name, inputNotes, outputNotes, sender, publicValue, publicOwner);
        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutput();
    }

    constructOutput() {
        this.output = outputCoder.encodeProofOutputs([
            {
                inputNotes: this.inputNotes,
                outputNotes: this.outputNotes,
                publicOwner: this.publicOwner,
                publicValue: this.publicValue,
                challenge: this.challengeHex,
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.output);
    }

    /**
     * Encode the join-split proof as data for an Ethereum transaction
     * @param {number} proof compressed AZTEC proof uint24 composed of three uint8s
     * @param {string[]} inputNotePrivateKeys array with the private keys of the owners of the input notes
     * @param {string} validator Ethereum address of the join-split validator contract
     * @returns {Object} AZTEC proof data and expected output
     */
    encodeABI(proof, inputNotePrivateKeys, validator) {
        if (proof < 65536) {
            throw new Error('compressed proof has to be bigger than 65536');
        }
        if (this.inputNotes.length !== inputNotePrivateKeys.length) {
            throw new Error("the length of the inputNoteOwners array doesn't match the length of the inputNotes array");
        }
        if (!ProofUtils.isEthereumAddress(validator)) {
            throw new Error('validator is not an Ethereum address');
        }

        const inputSignatures = this.inputNotes.map((inputNote, index) => {
            const domain = signer.generateAZTECDomainParams(validator, constants.eip712.ACE_DOMAIN_PARAMS);
            const schema = constants.eip712.JOIN_SPLIT_SIGNATURE;
            const message = {
                proof,
                noteHash: inputNote.noteHash,
                challenge: this.challenge,
                sender: this.sender,
            };
            const privateKey = inputNotePrivateKeys[index];
            const { signature } = signer.signTypedData(domain, schema, message, privateKey);
            return signature;
        });

        const data = inputCoder.joinSplit(
            this.data,
            this.m,
            this.challenge,
            inputSignatures,
            this.inputNoteOwners,
            this.outputNoteOwners,
            this.outputNotes,
        );
        return { data, inputSignatures };
    }
}

module.exports = JoinSplitProof;
