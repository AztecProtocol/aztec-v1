import * as bn128 from '@aztec/bn128';
import { constants, errors, proofs } from '@aztec/dev-utils';
import BN from 'bn.js';
import AbiCoder from 'web3-eth-abi';
import { keccak256, padLeft, randomHex } from 'web3-utils';
import { inputCoder, outputCoder } from '../../../../../encoder';
import Proof from '../../../../base/epoch0/proof';
import ProofType from '../../../../base/types';
import ProofUtils from '../../../../base/epoch0/utils';

const { AztecError } = errors;

class PrivateRangeProof66562 extends Proof {
    /**
    Constructs a private range proof - proving that the value of one AZTEC note, the originalNote, is greater than 
    the value of a second AZTEC note, the comparisonNote. The balancing relationship satisfied is:

    originalNoteValue = comparisonNoteValue + utilityNoteValue

    @param {Note} originalNote note whose value is being compared against the comparisonNote
    @param {Note} comparisonNote note being compared against
    @param {Note} utilityNote helper note used to construct a balancing relationship in the proof. The value of this note must
                              be chosen to satisfy the equation: originalNoteValue = comparisonNoteValue + utilityNoteValue
    @param {string} sender Ethereum address of the transaction sender
    @param {boolean} safeguard Boolean flag to turn on a balancing check prior to construction of proof
    */
    constructor(originalNote, comparisonNote, utilityNote, sender, safeguard = true) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.PRIVATE_RANGE.name, [originalNote, comparisonNote], [utilityNote], sender, publicValue, publicOwner, [
            utilityNote,
        ]);

        if (safeguard) {
            this.checkBalancingRelationShipSatisfied();
        }
        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutputs();
    }

    /**
     * Check that notes have been supplied which satisfy the privateRange balancing relationship
     *
     * Balancing relationship: originalNoteValue = comparisonNoteValue + utilityNoteValue
     */
    checkBalancingRelationShipSatisfied() {
        const originalNoteValue = this.notes[0].k.toNumber();
        const comparisonNoteValue = this.notes[1].k.toNumber();
        const utilityNoteValue = this.notes[2].k.toNumber();

        if (originalNoteValue !== comparisonNoteValue + utilityNoteValue) {
            throw new AztecError(errors.codes.BALANCING_RELATION_NOT_SATISFIED, {
                message: 'The supplied note values do not satisfy the privateRange balancing relationship',
                originalNoteValue,
                comparisonNoteValue,
                utilityNoteValue,
            });
        }
    }

    /**
     * Generate blinding factors based on the previous blinding scalars
     */
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
            let { bk } = blindingScalars[i];
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

            if (i === 2) {
                const x = reducer.redPow(new BN(i + 1));
                bk = blindingScalars[0].bk.redSub(blindingScalars[1].bk);

                const xbk = bk.redMul(x);
                const xba = ba.redMul(x);

                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
            }
            return {
                B,
                bk,
                ba,
            };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([this.sender, this.publicValue, this.publicOwner, this.notes, this.blindingFactors]);
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
                kBar = new BN(randomHex(32), 16).umod(bn128.curve.n).toString(16);
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
            AbiCoder.encodeParameters(['bytes32', 'uint24', 'address'], [this.hash, proofs.PRIVATE_RANGE_PROOF, this.sender]),
        );
    }

    /**
     * Encode the privateRange proof as data for an Ethereum transaction
     * @returns {Object} proof data and expected output
     */
    encodeABI() {
        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners(this.inputNoteOwners),
            inputCoder.encodeOwners(this.outputNoteOwners),
            inputCoder.encodeMetaData(this.outputNotes),
        ];

        // First hardcoded value in length calc is num of
        // elements prepending ...offsets in abiEncodedParams
        const length = 1 + encodedParams.length + 1;
        const offsets = ProofUtils.getOffsets(length, encodedParams);
        const abiEncodedParams = [this.challengeHex.slice(2), ...offsets, ...encodedParams];
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }
}

export default PrivateRangeProof66562;
