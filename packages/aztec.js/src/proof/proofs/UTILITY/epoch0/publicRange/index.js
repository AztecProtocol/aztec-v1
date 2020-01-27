import * as bn128 from '@aztec/bn128';
import { constants, errors, proofs } from '@aztec/dev-utils';
import BN from 'bn.js';
import AbiCoder from 'web3-eth-abi';
import { keccak256, padLeft } from 'web3-utils';
import helpers from './helpers';
import { inputCoder, outputCoder } from '../../../../../encoder';
import Proof from '../../../../base/epoch0/proof';
import ProofType from '../../../../base/types';
import ProofUtils from '../../../../base/epoch0/utils';

const { AztecError } = errors;

class PublicRangeProof66563 extends Proof {
    /**
     * Constructs a public range proof that a note is greater than or equal to, or less than or
     * equal to a public integer. Control of whether a > or < proof is constructed is determined
     * by an input boolean 'isGreaterOrEqual'.
     *
     * The balancing relation being satisfied is:
     * originalNoteValue = publicComparison + utilityNoteValue
     *
     * @param {Object} originalNote the note that a user is comparing against the publicComparison
     * @param {Number} publicComparison publicly visible integer, which the note is being compared against
     * @param {string} sender Ethereum address of the transaction sender
     * @param {bool} isGreaterOrEqual modifier controlling whether this is a greater than, or less
     * than proof. If true, it is a proof that originalNoteValue > publicComparison. If false, it is a
     * proof that originalNoteValue < publicComparison
     * @param {Note} utilityNote a helper note that is needed to satisfy a cryptographic balancing relation
     * @param {boolean} safeguard Boolean flag to turn on a balancing check prior to construction of proof
     */
    constructor(originalNote, publicComparison, sender, isGreaterOrEqual, utilityNote, safeguard = true) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.PUBLIC_RANGE.name, [originalNote], [utilityNote], sender, publicValue, publicOwner, [utilityNote]);

        helpers.checkPublicComparisonWellFormed(publicComparison);
        this.publicComparison = new BN(publicComparison);
        this.utilityNote = utilityNote;
        this.originalNote = originalNote;
        this.isGreaterOrEqual = isGreaterOrEqual;

        this.proofRelationChoice();

        if (safeguard) {
            this.checkBalancingRelationShipSatisfied();
        }

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutputs();
    }

    /**
     * Control whether the proof is used for a greater than (originalNote > publicComparison) or
     * less than (originalNote < publicComparison) proof.
     *
     * If greater than, the input publicComparison value is unchanged.
     *
     * If less than, the publicComparison value is negated; in order to satisfy the balancing
     * relationship
     */
    proofRelationChoice() {
        if (!this.isGreaterOrEqual) {
            this.publicComparison = this.publicComparison.neg();
        }
    }

    /**
     * Check that notes have been supplied which satisfy the publicRange balancing relationship
     *
     * Balancing relationship: originalNoteValue = publicComparison + utilityNoteValue
     */
    checkBalancingRelationShipSatisfied() {
        const originalNoteValue = this.notes[0].k.toNumber();
        const utilityNoteValue = this.notes[1].k.toNumber();
        const publicComparison = this.publicComparison.toNumber();

        if (originalNoteValue !== publicComparison + utilityNoteValue) {
            throw new AztecError(errors.codes.BALANCING_RELATION_NOT_SATISFIED, {
                message: 'The supplied note values do not satisfy the publicRange balancing relationship',
                originalNoteValue,
                utilityNoteValue,
                publicComparison,
            });
        }
    }

    constructBlindingFactors() {
        const blindingScalars = Array(this.notes.length)
            .fill()
            .map(() => {
                return {
                    bk: bn128.randomGroupScalar(),
                    ba: bn128.randomGroupScalar(),
                };
            });

        let B;
        const reducer = this.rollingHash.redKeccak();
        this.blindingFactors = this.notes.map((note, i) => {
            const { bk } = blindingScalars[0]; // trivially true for i=0, and enforcing k1 = k2 for i=1
            const { ba } = blindingScalars[i];

            if (i === 0) {
                B = note.gamma.mul(bk).add(bn128.h.mul(ba));
            }

            if (i === 1) {
                const x = reducer.redPow(new BN(i + 1));
                const xbk = bk.redMul(x);
                const xba = ba.redMul(x);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            }
            return { bk, ba, B };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([
            this.sender,
            this.publicComparison,
            this.publicValue,
            this.publicOwner,
            this.notes,
            this.blindingFactors,
        ]);
        this.challenge = this.challengeHash.redKeccak();
    }

    constructData() {
        this.data = this.blindingFactors.map(({ bk, ba }, i) => {
            const note = this.notes[i];
            const kBar = note.k
                .redMul(this.challenge)
                .redAdd(bk)
                .fromRed();
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
            AbiCoder.encodeParameters(['bytes32', 'uint24', 'address'], [this.hash, proofs.PUBLIC_RANGE_PROOF, this.sender]),
        );
    }

    encodeABI() {
        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners(this.inputNoteOwners),
            inputCoder.encodeOwners(this.outputNoteOwners),
            inputCoder.encodeMetaData(this.outputNotes),
        ];

        const length = 2 + encodedParams.length + 1;
        const offsets = ProofUtils.getOffsets(length, encodedParams);

        // If publicComparison < 0, make it compatible with finite field arithmetic
        if (Number(this.publicComparison) < 0) {
            const publicIntegerCastToField = bn128.groupModulus.add(this.publicComparison);
            this.publicComparison = publicIntegerCastToField;
        }
        const abiEncodedPublicInteger = padLeft(this.publicComparison.toString(16), 64);

        const abiEncodedParams = [this.challengeHex.slice(2), abiEncodedPublicInteger, ...offsets, ...encodedParams];
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }

    validateInputs() {
        super.validateInputs();
        if (this.notes.length !== 2) {
            throw new AztecError(errors.codes.INCORRECT_NOTE_NUMBER, {
                message: `Public range proofs must contain 2 notes`,
                numNotes: this.notes.length,
            });
        }
    }
}

export default PublicRangeProof66563;
