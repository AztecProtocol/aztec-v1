/* eslint-disable prefer-destructuring */
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

class SwapProof65794 extends Proof {
    constructor(inputNotes, outputNotes, sender) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.SWAP.name, inputNotes, outputNotes, sender, publicValue, publicOwner);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutputs();
    }

    /**
     * Construct blinding factors
     *
     * - The purpose is to set bk1 = bk3 and bk2 = bk4
     * - i is used as an indexing variable, to keep track of whether we are at a maker note or taker note
     * - All bks are stored in a bkArray. When we arrive at the taker notes, we set bk equal to the bk of
     *   the corresponding maker note. This is achieved by 'jumping back' 2 index positions (i - 2) in the
     *   bkArray, and setting the current bk equal to the element at the resulting position.
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

        let xbk;
        let xba;
        const reducer = this.rollingHash.redKeccak(); // "x" in the white paper
        this.blindingFactors = this.notes.map(({ gamma }, i) => {
            let { bk } = blindingScalars[i];
            const { ba } = blindingScalars[i];

            if (i === 0) {
                xbk = bk;
                xba = ba;
            }

            if (i > 0) {
                const x = reducer.redPow(new BN(i + 1));

                if (i > 1) {
                    bk = blindingScalars[i - 2].bk;
                }

                xbk = bk.redMul(x);
                xba = ba.redMul(x);
            }
            const B = gamma.mul(xbk).add(bn128.h.mul(xba));
            return { B, ba, bk };
        });
    }

    constructChallenge() {
        this.constructChallengeRecurse([this.sender, this.notes, this.blindingFactors]);
        this.challenge = this.challengeHash.redKeccak();
    }

    constructData() {
        this.data = this.blindingFactors.map(({ bk, ba }, i) => {
            const note = this.notes[i];
            let kBar;

            // Only set the first 2 values of kBar - the third and fourth are later inferred
            // from a cryptographic relation (this is why set the the third and fourth to random values,
            // leaving them zeroed or null-ed produces an error).
            if (i <= 1) {
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
        this.output = '';
        this.outputs = outputCoder.encodeProofOutputs([
            {
                inputNotes: [this.inputNotes[0]],
                outputNotes: [this.outputNotes[0]],
                publicValue: this.publicValue,
                publicOwner: this.publicOwner,
                challenge: this.challengeHex,
            },
            {
                inputNotes: [this.outputNotes[1]],
                outputNotes: [this.inputNotes[1]],
                publicValue: this.publicValue,
                publicOwner: this.publicOwner,
                challenge: `0x${keccak256(this.challengeHex).slice(2)}`,
            },
        ]);
        this.hash = outputCoder.hashProofOutput(this.outputs);
        this.validatedProofHash = keccak256(
            AbiCoder.encodeParameters(['bytes32', 'uint24', 'address'], [this.hash, proofs.SWAP_PROOF, this.sender]),
        );
    }

    encodeABI() {
        const encodedParams = [
            inputCoder.encodeProofData(this.data),
            inputCoder.encodeOwners([...this.inputNoteOwners, ...this.outputNoteOwners]),
            inputCoder.encodeMetaData([this.outputNotes[0], this.inputNotes[1]]),
        ];
        const length = 1 + encodedParams.length + 1;
        const offsets = ProofUtils.getOffsets(length, encodedParams);
        const abiEncodedParams = [this.challengeHex.slice(2), ...offsets, ...encodedParams];
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }

    validateInputs() {
        super.validateInputs();
        if (this.notes.length !== 4) {
            throw new AztecError(errors.codes.INCORRECT_NOTE_NUMBER, {
                message: `Swap proofs must contain 4 notes`,
                numNotes: this.notes.length,
            });
        }
    }
}

export default SwapProof65794;
