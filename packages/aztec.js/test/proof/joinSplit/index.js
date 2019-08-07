/* eslint-disable prefer-destructuring */
const bn128 = require('@aztec/bn128');
const { constants, errors } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { expect } = require('chai');
const { randomHex } = require('web3-utils');

const { JoinSplitProof } = require('../../../src/proof');
const { mockNoteSet, randomNoteValue } = require('../../helpers/note');
const ProofUtils = require('../../../src/proof/utils');
const { validateElement, validateScalar } = require('../../helpers/bn128');

const { K_MAX } = constants;

describe('Join-Split Proof', () => {
    let inputNotes;
    let kIn;
    let kOut;
    let outputNotes;
    let publicOwner;
    let sender;

    before(() => {
        kIn = Array(2)
            .fill()
            .map(() => randomNoteValue());
        kOut = Array(3)
            .fill()
            .map(() => randomNoteValue());
        publicOwner = randomHex(20);
        sender = randomHex(20);
    });

    beforeEach(async () => {
        const notes = await mockNoteSet(kIn, kOut);
        inputNotes = notes.inputNotes;
        outputNotes = notes.outputNotes;
    });

    describe('Success States', () => {
        it('should construct a Join-Split proof with well-formed outputs', async () => {
            let publicValue = ProofUtils.getPublicValue(kIn, kOut);
            publicValue = bn128.groupModulus.add(new BN(publicValue)).umod(bn128.groupModulus);
            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            expect(proof.data.length).to.equal(5);
            expect(proof.challengeHex.length).to.equal(66);
            validateScalar(proof.challengeHex);

            const dataLength = proof.data.length;
            proof.data.forEach((note, i) => {
                validateScalar(note[0], i === dataLength - 1);
                validateScalar(note[1]);
                validateElement(note[2], note[3]);
                validateElement(note[4], note[5]);
            });
            const lastNote = proof.data[dataLength - 1];
            expect(new BN(lastNote[0].slice(2), 16).eq(publicValue)).to.equal(true);
        });

        it('should construct a Join-Split proof with customMetaData', async () => {
            let publicValue = ProofUtils.getPublicValue(kIn, kOut);
            publicValue = bn128.groupModulus.add(new BN(publicValue)).umod(bn128.groupModulus);
            // eslint-disable-next-line max-len
            const customMetadata = '04a9ee474e6f1545e681cc62e518c43332715a2ea01067b9cb9356354e9c1c5398c43a1c80580c261eb75a96289f9b531fbf01dd02275dd5c2f36b17a6f62b0c8be765f2f27ad50383769ff0ceed7a97d07bc76c09599fee641e55764a8912860100000000000000000000000000000028000000000000000000000000000001a4000000000000000000000000000000003339c3c842732f4daacf12aed335661cf4eab66b9db634426a9b63244634d33a2590f06a5ede877e0f2c671075b1aa828a31cbae7462c581c5080390c96159d5c55fdee69634a22c7b9c6d5bc5aad15459282d9277bbd68a88b19857523657a958e1425ff7f315bbe373d3287805ed2a597c3ffab3e8767f9534d8637e793844c13b8c20a574c60e9c4831942b031d2b11a5af633f36615e7a27e4cacdbc7d52fe07056db87e8b545f45b79dac1585288421cc40c8387a65afc5b0e7f2b95a68b3f106d1b76e9fcb5a42d339e031e77d0e767467b5aa2496ee8f3267cbb823168215852aa4ef';

            const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner, customMetadata);
            expect(proof.data.length).to.equal(5);
            expect(proof.challengeHex.length).to.equal(66);
            validateScalar(proof.challengeHex);

            const dataLength = proof.data.length;
            proof.data.forEach((note, i) => {
                validateScalar(note[0], i === dataLength - 1);
                validateScalar(note[1]);
                validateElement(note[2], note[3]);
                validateElement(note[4], note[5]);
            });
            const lastNote = proof.data[dataLength - 1];
            expect(new BN(lastNote[0].slice(2), 16).eq(publicValue)).to.equal(true);
        });
    });

    describe('Failure States', () => {
        it('should fail if malformed public value', async () => {
            const publicValue = bn128.groupModulus.add(new BN(100));
            try {
                const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            } catch (err) {
                expect(err.message).to.equal(errors.codes.KPUBLIC_MALFORMED);
            }
        });

        it('should fail if public value > K_MAX', async () => {
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            inputNotes[0].k = new BN(K_MAX + 1).toRed(bn128.groupReduction);
            try {
                const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            } catch (err) {
                expect(err.message).to.equal(errors.codes.NOTE_VALUE_TOO_BIG);
            }
        });

        it('should fail if points NOT on curve', async () => {
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            inputNotes[0].gamma.x = new BN(bn128.fieldModulus.add(new BN(100))).toRed(bn128.curve.red);
            try {
                const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            } catch (err) {
                expect(err.message).to.equal(errors.codes.NOT_ON_CURVE);
            }
        });

        it('should fail if gamma at infinity', async () => {
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            inputNotes[0].gamma = inputNotes[0].gamma.add(inputNotes[0].gamma.neg());
            try {
                const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            } catch (err) {
                expect(err.message).to.equal(errors.codes.POINT_AT_INFINITY);
            }
        });

        it('should fail if malformed viewing key', async () => {
            const publicValue = ProofUtils.getPublicValue(kIn, kOut);
            inputNotes[0].a = bn128.zeroBnRed;
            try {
                const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicValue, publicOwner);
            } catch (err) {
                expect(err.message).to.equal(errors.codes.VIEWING_KEY_MALFORMED);
            }
        });
    });
});
