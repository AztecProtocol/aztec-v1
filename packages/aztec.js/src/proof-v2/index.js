const { constants, errors, proofs } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { Enum } = require('enumify');
const { padLeft } = require('web3-utils');

const { inputCoder, outputCoder } = require('../abiEncoder');
const bn128 = require('../bn128');
const Keccak = require('../keccak');
const { ProofUtils } = require('./utils');
const signer = require('../signer');
const types = require('./types');

const { AztecError, codes } = errors;
const { groupReduction } = bn128;

class ProofType extends Enum {}
ProofType.initEnum(types);

/**
 * Class for creating, storing and passing AZTEC proofs and related transcripts, outputs and hashes.
 */
class Proof {
    /**
     * @param {string} type one of the ProofType enum values
     * @param {Note[]} inputNotes input AZTEC notes
     * @param {Note[]} outputNotes output AZTEC notes
     * @param {string} sender Ethereum address of transaction sender
     * @param {string} publicOwner holder of a public token being converted
     * @param {string} kPublic public commitment being added to proof
     */
    constructor(type, inputNotes, outputNotes, sender, publicOwner, kPublic) {
        if (!ProofType[type]) {
            throw new Error(`proof type should be one of ${ProofType.enumValues}`);
        }
        this.type = type;
        const notes = [...inputNotes, ...outputNotes];
        if (notes.length === 0) {
            throw new Error('the input and output notes arrays cannot be both empty');
        }
        this.inputNotes = inputNotes;
        this.m = inputNotes.length;
        this.outputNotes = outputNotes;
        this.notes = notes;
        if (!ProofUtils.isEthereumAddress(sender)) {
            throw new Error('sender is not an Ethereum address');
        }
        this.sender = sender;
        if (!ProofUtils.isEthereumAddress(publicOwner)) {
            throw new Error('publicOwner is not an Ethereum address');
        }
        this.publicOwner = publicOwner;

        if (BN.isBN(kPublic)) {
            this.kPublic = kPublic;
        } else if (kPublic < 0) {
            this.kPublic = bn128.curve.n.sub(new BN(-kPublic));
        } else {
            this.kPublic = new BN(kPublic);
        }
        this.validateInputs();

        // rolling hash is used to combine multiple bilinear pairing comparisons into a single comparison
        this.rollingHash = new Keccak();
        notes.forEach((note) => {
            this.rollingHash.append(note.gamma);
            this.rollingHash.append(note.sigma);
        });

        this.constructBlindingScalars();
        this.constructBlindingFactors();
        this.constructChallenge(sender, this.kPublic, this.m, publicOwner, notes, this.blindingFactors);
        this.constructData();
    }

    get challengeHex() {
        return `0x${padLeft(this.challenge.toString(16), 64)}`;
    }

    get eth() {
        return {
            output: `0x${this.output.slice(0x42)}`,
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

    constructBlindingFactors() {
        let B;
        let runningBk = new BN(0).toRed(groupReduction);
        let x = new BN(0).toRed(groupReduction);

        this.blindingFactors = this.notes.map((note, i) => {
            const { bk, ba } = this.blindingScalars[i];
            if (i + 1 > this.m) {
                // get next iteration of our rolling hash
                x = this.rollingHash.keccak(groupReduction);
                const xbk = bk.redMul(x);
                const xba = ba.redMul(x);
                runningBk = runningBk.redSub(bk);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            } else {
                runningBk = runningBk.redAdd(bk);
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            }
            return { bk, ba, B, x };
        });
    }

    /**
     * Generate random blinding scalars, conditional on the AZTEC join-split proof statement.
     *   Separated out into a distinct method so that we can stub this for extractor tests
     */
    constructBlindingScalars() {
        const n = this.notes.length;
        let runningBk = new BN(0).toRed(groupReduction);
        this.blindingScalars = [...Array(n)].map((_, i) => {
            let bk = bn128.randomGroupScalar();
            const ba = bn128.randomGroupScalar();
            if (i === n - 1) {
                if (n === this.m) {
                    bk = new BN(0).toRed(groupReduction).redSub(runningBk);
                } else {
                    bk = runningBk;
                }
            }
            if (i + 1 > this.m) {
                runningBk = runningBk.redSub(bk);
            } else {
                runningBk = runningBk.redAdd(bk);
            }
            return { bk, ba };
        });
    }

    /**
     * Compute the Fiat-Shamir heuristic-ified challenge variable.
     *   Separated out into a distinct method so that we can stub this for extractor tests
     * @param {string} sender Ethereum address of transaction sender
     * @param {string} kPublic public commitment being added to proof
     * @param {number} m number of input notes
     * @param {Note[]} notes array of AZTEC notes
     * @param {Object[]} blindingFactors array of computed blinding factors, one for each note
     */
    constructChallenge(...challengeVariables) {
        const hash = new Keccak();
        const recurse = (inputs) => {
            inputs.forEach((challengeVar) => {
                if (typeof challengeVar === 'string') {
                    hash.appendBN(new BN(challengeVar.slice(2), 16));
                } else if (typeof challengeVar === 'number') {
                    hash.appendBN(new BN(challengeVar));
                } else if (BN.isBN(challengeVar)) {
                    hash.appendBN(challengeVar.umod(bn128.curve.n));
                } else if (Array.isArray(challengeVar)) {
                    recurse(challengeVar);
                } else if (challengeVar.gamma) {
                    hash.append(challengeVar.gamma);
                    hash.append(challengeVar.sigma);
                } else if (challengeVar.B) {
                    hash.append(challengeVar.B);
                } else {
                    throw new AztecError(codes.NO_ADD_CHALLENGEVAR, {
                        message: 'Can not add the challenge variable to the hash',
                        challengeVar,
                        type: typeof challengeVar,
                    });
                }
            });
        };
        recurse(challengeVariables);
        this.challenge = hash.keccak(groupReduction);
    }

    constructData() {
        this.data = this.blindingFactors.map((blindingFactor, i) => {
            const note = this.notes[i];
            let kBar = note.k
                .redMul(this.challenge)
                .redAdd(blindingFactor.bk)
                .fromRed();
            if (i === this.notes.length - 1) {
                kBar = this.kPublic;
            }
            const aBar = note.a
                .redMul(this.challenge)
                .redAdd(blindingFactor.ba)
                .fromRed();
            return [
                `0x${padLeft(kBar.toString(16), 64)}`,
                `0x${padLeft(aBar.toString(16), 64)}`,
                `0x${padLeft(note.gamma.x.fromRed().toString(16), 64)}`,
                `0x${padLeft(note.gamma.y.fromRed().toString(16), 64)}`,
                `0x${padLeft(note.sigma.x.fromRed().toString(16), 64)}`,
                `0x${padLeft(note.sigma.y.fromRed().toString(16), 64)}`,
            ];
        });
    }

    /**
     * Validate that the inputs in the constructor are well-formed
     */
    validateInputs() {
        this.notes.forEach((testNote) => {
            if (!testNote.a.fromRed().lt(bn128.curve.n) || testNote.a.fromRed().eq(new BN(0))) {
                throw new AztecError(codes.VIEWING_KEY_MALFORMED, {
                    message: 'Viewing key is malformed',
                    viewingKey: testNote.a.fromRed(),
                    criteria: `Viewing key should be less than ${bn128.curve.n}
                    and greater than zero`,
                });
            }

            if (!testNote.k.fromRed().lt(new BN(constants.K_MAX))) {
                throw new AztecError(codes.NOTE_VALUE_TOO_BIG, {
                    message: 'Note value is equal to or greater than K_MAX',
                    noteValue: testNote.k.fromRed(),
                    K_MAX: constants.K_MAX,
                });
            }

            if (testNote.gamma.isInfinity() || testNote.sigma.isInfinity()) {
                throw new AztecError(codes.POINT_AT_INFINITY, {
                    message: 'One of the note points is at infinity',
                    gamma: testNote.gamma.isInfinity(),
                    sigma: testNote.sigma.isInfinity(),
                });
            }

            if (!ProofUtils.isOnCurve(testNote.gamma) || !ProofUtils.isOnCurve(testNote.sigma)) {
                throw new AztecError(codes.NOT_ON_CURVE, {
                    message: 'A note group element is not on the curve',
                    gammaOnCurve: ProofUtils.isOnCurve(testNote.gamma),
                    sigmaOnCurve: ProofUtils.isOnCurve(testNote.sigma),
                });
            }
        });

        if (!this.kPublic.lt(bn128.curve.n)) {
            throw new AztecError(codes.KPUBLIC_MALFORMED, {
                message: 'kPublic is too big',
                kPublic: this.kPublic,
                maxValue: bn128.curve.n,
            });
        }

        if (this.type === ProofType.BURN || this.type === ProofType.MINT) {
            const numNotes = this.notes.length;
            if (numNotes < 2) {
                throw new AztecError(codes.INCORRECT_NOTE_NUMBER, {
                    message: `There are less than 2 notes, this is not possible in a ${this.type} proof`,
                    numNotes,
                });
            }
        }
    }
}

module.exports = { Proof, ProofType };
