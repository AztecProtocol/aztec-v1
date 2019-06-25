const { constants, proofs } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { AbiCoder } = require('web3-eth-abi');
const { keccak256, padLeft, randomHex } = require('web3-utils');

const bn128 = require('../../bn128');
const { inputCoder, outputCoder } = require('../../encoder');
const { Proof, ProofType } = require('../proof');
const ProofUtils = require('../utils');

class PrivateRangeProof extends Proof {
    constructor(originalNote, comparisonNote, utilityNote, sender) {
        const publicValue = constants.ZERO_BN;
        const publicOwner = constants.addresses.ZERO_ADDRESS;
        super(ProofType.PRIVATE_RANGE.name, [originalNote, comparisonNote], [utilityNote], sender, publicValue, publicOwner, [
            utilityNote,
        ]);

        this.constructBlindingFactors();
        this.constructChallenge();
        this.constructData();
        this.constructOutputs();
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
        // let reducer = this.rollingHash.redKeccak(); // "x" in the white paper
        // console.log('Construction');
        let reducer;

        const baSelection = [new BN(74598, 16).toRed(constants.BN128_GROUP_REDUCTION), new BN(85944, 16).toRed(constants.BN128_GROUP_REDUCTION), new BN(95548, 16).toRed(constants.BN128_GROUP_REDUCTION)];
        const bkSelection = [new BN(98584, 16).toRed(constants.BN128_GROUP_REDUCTION), new BN(83498, 16).toRed(constants.BN128_GROUP_REDUCTION), new BN(93741, 16).toRed(constants.BN128_GROUP_REDUCTION)];
        this.blindingFactors = this.notes.map((note, i) => {
            let { bk } = blindingScalars[i];
            const { ba } = blindingScalars[i];

            // const baSelection = [new BN(74598).toRed(constants.BN128_GROUP_REDUCTION), new BN(85944).toRed(constants.BN128_GROUP_REDUCTION), new BN(95548).toRed(constants.BN128_GROUP_REDUCTION)];
            // const bkSelection = [new BN(98584).toRed(constants.BN128_GROUP_REDUCTION), new BN(83498).toRed(constants.BN128_GROUP_REDUCTION), new BN(93741).toRed(constants.BN128_GROUP_REDUCTION)];
            if (i === 0) {
                B = note.gamma.mul(bkSelection[0]).add(bn128.h.mul(baSelection[0]));
                console.log('i: ', i, 'B.x: ', B.x.toString());
            };

            if (i === 1) {
                reducer = this.rollingHash.redKeccak();
                const xbk = bkSelection[1].redMul(reducer);
                const xba = baSelection[1].redMul(reducer);
                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
                console.log('i: ', i, 'B.x: ', B.x.toString());
            };

            if (i === 2) {
                reducer = this.rollingHash.redKeccak();
                bkSelection[2] = bkSelection[0].redAdd(bkSelection[1]);
                // bk = (blindingScalars[0].bk).redSub(blindingScalars[1].bk);
                // console.log('bk: ', bk.fromRed().toString());
                // console.log('reducer: ', reducer);

                const xbk = bkSelection[2].redMul(reducer);
                const xba = baSelection[2].redMul(reducer);
                // console.log('gamma: ', note.gamma);

                B = note.gamma.mul(xbk).add(bn128.h.mul(xba));
                console.log('i: ', i, 'B.x: ', B.x.toString());
                console.log('i: ', i, 'B.x: ', B.x.fromRed().toString((16), 64));
                console.log('i: ', i, 'B.y: ', B.y.fromRed().toString((16), 64));

            }
            return {
                B,
                bk: bkSelection[i], // bkSelection[i],
                ba: baSelection[i], // baSelection[i],
            };
        });
        console.log('bk: ', this.blindingFactors[2].bk.fromRed().toString());

    }

    constructChallenge() {
        // console.log('this.sender: ', this.sender);
        // console.log('this.publicValue: ', this.publicValue);
        // console.log('this.publicOwner: ', this.publicOwner);
        // console.log('this.notes: ', this.notes);
        // console.log('this.blindingFactors: ', this.blindingFactors);

        // console.log('intial blinding factors: ', this.blindingFactors);
        this.constructChallengeRecurse([this.sender, this.publicValue, this.publicOwner, this.notes, this.blindingFactors]);
        // console.log('proof construction challenge hash: ', this.challengeHash);
        this.challenge = this.challengeHash.redKeccak();
        console.log('original challenge: ', this.challenge.fromRed().toString());

        // console.log('original challenge: ', `0x${padLeft(this.challenge.toString(16), 64)}`);
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
                // console.log('kBar: ', kBar.toString(), 'i: ', i);
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

        // console.log('this.data in proof construction: ', this.data);
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

        // need to add this constant to proofs in dev-utils once Paul's done
        // the 'uint24' needs to become proofs.PRIVATE_RANGE_PROOF = 66562
        const PRIVATE_RANGE_PROOF = 66562;
        this.validatedProofHash = keccak256(
            new AbiCoder().encodeParameters(['bytes32', 'uint24', 'address'], [this.hash, PRIVATE_RANGE_PROOF, this.sender]),
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
            inputCoder.encodeMetadata(this.metadata),
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
        return `0x${abiEncodedParams.join('').toLowerCase()}`;
    }
}

module.exports = PrivateRangeProof;
