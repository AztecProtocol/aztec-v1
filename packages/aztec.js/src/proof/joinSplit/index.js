const bn128 = require('@aztec/bn128');
const { proofs } = require('@aztec/dev-utils');
const AbiCoder = require('web3-eth-abi');
const { keccak256, padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../../encoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');
const signer = require('../../signer');

class JoinSplitProof extends Proof {
    /**
     * Constructs a joinSplit proof. This is the standard AZTEC zero-knowledge proof that can be used
     * to convert ERC20 tokens into AZTEC notes and vice versa. It can also be used to transfer notes.
     *
     * @param {Object[]} inputNotes - array of input notes, to be removed from a note registry
     * @param {Object[]} outputNotes - array of output notes, to be added to a note registry
     * @param {string} sender - Ethereum address of the transaction sender
     * @param {Number} publicValue - number of public ERC20 tokens being converted into notes or vice versa
     * @param {string} publicOwner - Ethereum address of the publicValue owner
     */
    constructor(inputNotes, outputNotes, sender, publicValue, publicOwner) {
        super(ProofType.JOIN_SPLIT.name, inputNotes, outputNotes, sender, publicValue, publicOwner);

        this.constructBlindingScalars();
        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutputs();
    }

    /**
     * Generate blinding factors based on the previous blinding scalars
     */
    constructBlindingFactors() {
        const inputNotesLength = this.m;
        let reducer = bn128.zeroBnRed; // "x" in the white paper
        this.blindingFactors = this.notes.map((note, i) => {
            const { bk, ba } = this.blindingScalars[i];
            let B;
            if (i < inputNotesLength) {
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            } else {
                // Get next iteration of our rolling hash
                reducer = this.rollingHash.redKeccak();
                const xbk = bk.redMul(reducer);
                const xba = ba.redMul(reducer);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            }
            return { B, bk, ba, reducer };
        });
    }

    /**
     * Generate random blinding scalars, conditional on the AZTEC join-split proof statement.
     */
    constructBlindingScalars() {
        const notesLength = this.notes.length;
        let bkAux = bn128.zeroBnRed;
        this.blindingScalars = Array(notesLength)
            .fill()
            .map((_, i) => {
                let bk = bn128.randomGroupScalar();
                const ba = bn128.randomGroupScalar();
                if (i === notesLength - 1) {
                    if (this.m === notesLength) {
                        bk = bn128.zeroBnRed.redSub(bkAux);
                    } else {
                        bk = bkAux;
                    }
                }
                if (i + 1 > this.m) {
                    bkAux = bkAux.redSub(bk);
                } else {
                    bkAux = bkAux.redAdd(bk);
                }
                return { bk, ba };
            });
    }

    constructChallenge() {
        this.constructChallengeRecurse([
            this.sender,
            this.publicValue,
            this.m,
            this.publicOwner,
            this.notes,
            this.blindingFactors,
        ]);
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
                kBar = this.publicValue;
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
            AbiCoder.encodeParameters(['bytes32', 'uint24', 'address'], [this.hash, proofs.JOIN_SPLIT_PROOF, this.sender]),
        );
    }

    /**
     * Construct EIP712 signatures, giving permission for the input notes to be spent
     * @param {string} verifyingContract Ethereum address of the ZkAsset contract, from which confidentialTransfer() is
     * called
     * @param {string[]} inputNoteOwners Ethereum accounts of input note owners
     * @returns {string} array of signatures
     */
    constructSignatures(verifyingContract, inputNoteOwners) {
        return signer.signMultipleNotesForConfidentialTransfer(
            verifyingContract,
            inputNoteOwners,
            this.inputNotes,
            this.challengeHex,
            this.sender,
        );
    }

    /**
     * Encode the join-split proof as data for an Ethereum transaction
     * @param {string} validator Ethereum address of the join-split validator contract
     * @returns {Object} proof data and expected output
     */
    encodeABI(validator) {
        if (!ProofUtils.isEthereumAddress(validator)) {
            throw new Error('validator is not an Ethereum address');
        }

        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners(this.inputNoteOwners),
            inputCoder.encodeOwners(this.outputNoteOwners),
            inputCoder.encodeMetaData(this.outputNotes),
        ];

        const length = 3 + encodedParams.length + 1;
        const offsets = ProofUtils.getOffsets(length, encodedParams);
        const abiEncodedParams = [
            padLeft(this.m.toString(16), 64),
            this.challengeHex.slice(2),
            padLeft(this.publicOwner.slice(2), 64),
            ...offsets,
            ...encodedParams,
        ];
        return `0x${abiEncodedParams.join('')}`;
    }
}

module.exports = JoinSplitProof;
