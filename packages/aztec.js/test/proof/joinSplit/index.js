/* eslint-disable new-cap */
/* eslint-disable prefer-destructuring */
import * as bn128 from '@aztec/bn128';

import { constants, errors } from '@aztec/dev-utils';
import BN from 'bn.js';
import { expect } from 'chai';
import { randomHex } from 'web3-utils';
import { JoinSplitProof } from '../../../src/proof';
import { mockNoteSet, randomNoteValue } from '../../helpers/note';
import ProofUtils from '../../../src/proof/base/epoch0/utils';
import { validateElement, validateScalar } from '../../helpers/bn128';

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
