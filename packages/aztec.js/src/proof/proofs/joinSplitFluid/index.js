import { constants, errors, proofs } from '@aztec/dev-utils';
import AbiCoder from 'web3-eth-abi';
import { keccak256 } from 'web3-utils';
import { inputCoder, outputCoder } from '../../../encoder';
import JoinSplitProof from '../BALANCED/epoch0/joinSplit';
import ProofType from '../../base/types';
import ProofUtils from '../../base/epoch0/utils';

const { AztecError } = errors;

class JoinSplitFluidProof extends JoinSplitProof {
    /**
     * JoinSplitFluidProof, this is a variation of the JoinSplit proof and is used to construct mint or burn proofs.
     * A mint proof is one in which AZTEC notes are artificially created, without any transfer of ERC20 tokens, whilst a
     * burn proof is on in which AZTEC notes are artifically destroyed, without any transfer of ERC20 tokens.
     *
     * It is important to have the ability to keep track of the total number of minted or burned notes. To do this,
     * `currentTotalValueNote` and `newTotalValueNote` are supplied to the proof. `currentTotalValueNote` is an AZTEC note
     * representing the current total value of notes minted or burned. `newTotalValueNote` is the total number of notes
     * that will have been minted or burned after the execution of the proof.
     *
     * The balancing relationship being satisfied is:
     *
     * currentTotalValue = newTotalValue + adjustedNotesValue
     *
     * The cryptography of both proofs is the same as the JoinSplit proof, the difference is that there must be a minimum
     * of 2 notes.
     *
     * @param {string} type - name of the proof being executed, MINT or BURN
     * @param {Object} currentTotalValueNote - note whose value represents the total current value of minted or burned notes
     * @param {Object} newTotalValueNote - note whose value represents the new total value of minted or burned notes
     * @param {Object[]} adjustedNotes - notes to be minted or burned
     * @param {string} sender - Ethereum address of the transaction sender
     */
    constructor(type, currentTotalValueNote, newTotalValueNote, adjustedNotes, sender) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super([newTotalValueNote], [currentTotalValueNote, ...adjustedNotes], sender, publicValue, publicOwner);

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

    constructOutputs() {
        this.output = '';
        this.outputs = outputCoder.encodeProofOutputs([
            {
                inputNotes: [
                    {
                        ...this.outputNotes[0],
                    },
                ],
                outputNotes: [
                    {
                        ...this.inputNotes[0],
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
                challenge: keccak256(this.challengeHex),
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.outputs);
        const proofId = this.type === ProofType.BURN.name ? proofs.BURN_PROOF : proofs.MINT_PROOF;
        this.validatedProofHash = keccak256(
            AbiCoder.encodeParameters(['bytes32', 'uint24', 'address'], [this.hash, proofId, this.sender]),
        );
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
            inputCoder.encodeMetaData([this.inputNotes[0], ...this.outputNotes.slice(1)]),
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

export default JoinSplitFluidProof;
