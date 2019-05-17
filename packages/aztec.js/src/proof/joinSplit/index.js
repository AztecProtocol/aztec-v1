const { constants } = require('@aztec/dev-utils');

const bn128 = require('../../bn128');
const { inputCoder, outputCoder } = require('../../abiEncoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');
const signer = require('../../signer');

class JoinSplitProof extends Proof {
    constructor(inputNotes, outputNotes, sender, publicValue, publicOwner) {
        super(ProofType.JOIN_SPLIT.name, inputNotes, outputNotes, sender, publicValue, publicOwner);

        this.constructBlindingScalars();
        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutput();
    }

    constructBlindingFactors() {
        const inputNotesLength = this.m;

        // Generate blinding factors based on the previous blinding scalars
        let bkAux = constants.ZERO_BN_RED;
        this.blindingFactors = this.notes.map((note, i) => {
            const { bk, ba } = this.blindingScalars[i];
            let B;
            let reducer = constants.ZERO_BN_RED; // "x" in the white paper

            if (i < inputNotesLength) {
                bkAux = bkAux.redAdd(bk);
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            } else {
                // Get next iteration of our rolling hash
                reducer = this.rollingHash.keccak(constants.BN128_GROUP_REDUCTION);
                const xbk = bk.redMul(reducer);
                const xba = ba.redMul(reducer);
                bkAux = bkAux.redSub(bk);
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
        let bkAux = constants.ZERO_BN_RED;
        this.blindingScalars = Array(notesLength)
            .fill()
            .map((_, i) => {
                let bk = bn128.randomGroupScalar();
                const ba = bn128.randomGroupScalar();
                if (i === notesLength - 1) {
                    if (notesLength === this.m) {
                        bk = constants.ZERO_BN_RED.redSub(bkAux);
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
        this.challenge = this.challengeHash.keccak(constants.BN128_GROUP_REDUCTION);
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
     * @param {string} validator Ethereum address of the join-split validator contract
     * @param {string[]} inputNotePrivateKeys array with the private keys of the owners of the input notes
     * @returns {Object} AZTEC proof data and expected output
     */
    encodeABI(proof, validator, inputNotePrivateKeys) {
        if (proof < 65536) {
            throw new Error('compressed proof has to be bigger than 65536');
        }
        if (!ProofUtils.isEthereumAddress(validator)) {
            throw new Error('validator is not an Ethereum address');
        }
        if (this.inputNotes.length !== inputNotePrivateKeys.length) {
            throw new Error("the length of the inputNoteOwners array doesn't match the length of the inputNotes array");
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
