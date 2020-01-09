import * as bn128 from '@aztec/bn128';
import { constants, errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import { padLeft } from 'web3-utils';
import Keccak from '../../../keccak';
import ProofType from '../types';
import ProofUtils from './utils';

const { AztecError } = errors;

/**
 * @class
 * @class Class to create, store and pass around AZTEC proofs and related transcripts, outputs and hashes.
 */
class Proof {
    /**
     * @param {string} type one of the ProofType enum values
     * @param {Note[]} inputNotes input AZTEC notes
     * @param {Note[]} outputNotes output AZTEC notes
     * @param {string} sender Ethereum address of transaction sender
     * @param {string} publicValue public commitment being added to proof
     * @param {string} publicOwner holder of a public token being converted
     */
    constructor(type, inputNotes, outputNotes, sender, publicValue, publicOwner) {
        this.type = type;
        this.inputNotes = inputNotes;
        this.m = inputNotes.length;
        this.outputNotes = outputNotes;
        this.notes = [...inputNotes, ...outputNotes];
        this.sender = sender;
        this.publicOwner = publicOwner;
        if (BN.isBN(publicValue)) {
            this.publicValue = publicValue;
        } else if (publicValue < 0) {
            this.publicValue = bn128.groupModulus.sub(new BN(-publicValue));
        } else {
            this.publicValue = new BN(publicValue);
        }
        this.validateInputs();
        this.constructChallengeHashes();
    }

    get challengeHex() {
        return `0x${padLeft(this.challenge.toString(16), 64)}`;
    }

    get eth() {
        return {
            // Ethereum will automatically prepend a bytes array with an evm word that
            // represents the length of the bytes array
            output: `0x${this.output.slice(0x40)}`,
            outputs: `0x${this.outputs.slice(0x42)}`,
        };
    }

    get inputNoteOwners() {
        if (!this.inputNotes || this.inputNotes.length === 0) {
            return [];
        }
        return this.inputNotes.map((n) => n.owner);
    }

    get outputNoteOwners() {
        if (!this.outputNotes || this.outputNotes.length === 0) {
            return [];
        }
        return this.outputNotes.map((n) => n.owner);
    }

    constructChallengeHashes() {
        this.challengeHash = new Keccak();
        this.rollingHash = new Keccak();
        this.notes.forEach((note) => {
            this.rollingHash.appendPoint(note.gamma);
            this.rollingHash.appendPoint(note.sigma);
        });
    }

    /**
     * Compute the Fiat-Shamir heuristic-ified challenge variable.
     *   Separated out into a distinct method so that we can stub this for extractor tests
     */
    constructChallengeRecurse(inputs) {
        inputs.forEach((challengeVar) => {
            if (typeof challengeVar === 'string') {
                this.challengeHash.appendBN(new BN(challengeVar.slice(2), 16));
            } else if (typeof challengeVar === 'number') {
                this.challengeHash.appendBN(new BN(challengeVar));
            } else if (BN.isBN(challengeVar)) {
                this.challengeHash.appendBN(challengeVar.umod(bn128.curve.n));
            } else if (Array.isArray(challengeVar)) {
                this.constructChallengeRecurse(challengeVar);
            } else if (challengeVar.gamma) {
                this.challengeHash.appendPoint(challengeVar.gamma);
                this.challengeHash.appendPoint(challengeVar.sigma);
            } else if (challengeVar.B) {
                this.challengeHash.appendPoint(challengeVar.B);
            } else {
                throw new AztecError(errors.codes.NO_ADD_CHALLENGEVAR, {
                    message: 'Can not add the challenge variable to the hash',
                    challengeVar,
                    type: typeof challengeVar,
                });
            }
        });
    }

    // eslint-disable-next-line class-methods-use-this
    constructData() {}

    // eslint-disable-next-line class-methods-use-this
    constructOutput() {}

    /**
     * Validate that the inputs in the constructor are well-formed
     */
    validateInputs() {
        if (!this.type || !ProofType[this.type]) {
            throw new Error(`Proof type should be one of ${ProofType.enumValues}`);
        }
        if (!ProofUtils.isEthereumAddress(this.sender)) {
            throw new Error('sender is not an Ethereum address');
        }

        if (!this.publicValue.lt(bn128.curve.n)) {
            throw new AztecError(errors.codes.KPUBLIC_MALFORMED, {
                message: 'publicValue is too big',
                publicValue: this.publicValue,
                maxValue: bn128.curve.n,
            });
        }

        if (!ProofUtils.isEthereumAddress(this.publicOwner)) {
            throw new Error('publicOwner is not an Ethereum address');
        }

        if (this.notes.length === 0) {
            throw new Error('the input and output notes arrays cannot be both empty');
        }

        this.notes.forEach((testNote) => {
            if (!testNote.a.fromRed().lt(bn128.curve.n) || testNote.a.fromRed().eq(constants.ZERO_BN)) {
                throw new AztecError(errors.codes.VIEWING_KEY_MALFORMED, {
                    message: 'Viewing key is malformed',
                    viewingKey: testNote.a.fromRed(),
                    criteria: `Viewing key should be less than ${bn128.curve.n} and greater than zero`,
                });
            }

            if (!testNote.k.fromRed().lt(new BN(constants.K_MAX))) {
                throw new AztecError(errors.codes.NOTE_VALUE_TOO_BIG, {
                    message: 'Note value is equal to or greater than K_MAX',
                    noteValue: testNote.k.fromRed(),
                    K_MAX: constants.K_MAX,
                });
            }

            if (testNote.gamma.isInfinity() || testNote.sigma.isInfinity()) {
                throw new AztecError(errors.codes.POINT_AT_INFINITY, {
                    message: 'One of the note points is at infinity',
                    gamma: testNote.gamma.isInfinity(),
                    sigma: testNote.sigma.isInfinity(),
                });
            }

            if (!ProofUtils.validatePointOnCurve(testNote.gamma) || !ProofUtils.validatePointOnCurve(testNote.sigma)) {
                throw new AztecError(errors.codes.NOT_ON_CURVE, {
                    message: 'A note group element is not on the curve',
                    gammaOnCurve: ProofUtils.validatePointOnCurve(testNote.gamma),
                    sigmaOnCurve: ProofUtils.validatePointOnCurve(testNote.sigma),
                });
            }
        });
    }
}

export default Proof;
