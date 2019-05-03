const { constants, errors } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { expect } = require('chai');

const { mockNoteSet } = require('../../helpers/proof');
const { validateElement, validateScalar } = require('../../helpers/bn128');

const bn128 = require('../../../src/bn128');
const { JoinSplitProof } = require('../../../src/proof-v2/joinSplit');
const { ProofUtils } = require('../../../src/proof-v2/utils');

const { codes } = errors;

describe.only('Join-Split Proofs', () => {
    let kIn;
    let kOut;
    let publicOwner;
    let sender;

    before(() => {
        kIn = [...Array(2)].map(() => ProofUtils.randomNoteValue());
        kOut = [...Array(3)].map(() => ProofUtils.randomNoteValue());
        publicOwner = ProofUtils.randomAddress();
        sender = ProofUtils.randomAddress();
    });

    it('should construct a proof with well-formed outputs', async () => {
        const { inputNotes, outputNotes } = await mockNoteSet({ kIn, kOut });
        let kPublic = ProofUtils.getKPublic(kIn, kOut);
        kPublic = bn128.curve.n.add(new BN(kPublic)).umod(bn128.curve.n);
        const proof = new JoinSplitProof(inputNotes, outputNotes, sender, publicOwner, kPublic);

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
        expect(new BN(lastNote[0].slice(2), 16).eq(kPublic)).to.equal(true);
    });

    it('should fail to construct a proof with malformed kPublic', async () => {
        const { inputNotes, outputNotes } = await mockNoteSet({ kIn, kOut });
        const kPublic = bn128.curve.n.add(new BN(100));
        try {
            const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicOwner, kPublic);
        } catch (err) {
            expect(err.message).to.equal(codes.KPUBLIC_MALFORMED);
        }
    });

    it('should fail to construct a proof if point NOT on curve', async () => {
        const { inputNotes, outputNotes } = await mockNoteSet({ kIn, kOut });
        const kPublic = ProofUtils.getKPublic(kIn, kOut);
        inputNotes[0].gamma.x = new BN(bn128.curve.p.add(new BN(100))).toRed(bn128.curve.red);
        try {
            const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicOwner, kPublic);
        } catch (err) {
            expect(err.message).to.equal(codes.NOT_ON_CURVE);
        }
    });

    it('should fail to construct a proof for the point at infinity', async () => {
        const { inputNotes, outputNotes } = await mockNoteSet({ kIn, kOut });
        const kPublic = ProofUtils.getKPublic(kIn, kOut);
        inputNotes[0].gamma = inputNotes[0].gamma.add(inputNotes[0].gamma.neg());
        try {
            const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicOwner, kPublic);
        } catch (err) {
            expect(err.message).to.equal(codes.POINT_AT_INFINITY);
        }
    });

    it('should fail to construct a proof if viewing key response is 0', async () => {
        const kPublic = ProofUtils.getKPublic(kIn, kOut);
        const { inputNotes, outputNotes } = await mockNoteSet({ kIn, kOut });
        inputNotes[0].a = new BN(0).toRed(bn128.groupReduction);
        try {
            const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicOwner, kPublic);
        } catch (err) {
            expect(err.message).to.equal(codes.VIEWING_KEY_MALFORMED);
        }
    });

    it('should fail to construct a proof if value > K_MAX', async () => {
        const { inputNotes, outputNotes } = await mockNoteSet({ kIn, kOut });
        const kPublic = ProofUtils.getKPublic(kIn, kOut);
        inputNotes[0].k = new BN(constants.K_MAX + 1).toRed(bn128.groupReduction);
        try {
            const _ = new JoinSplitProof(inputNotes, outputNotes, sender, publicOwner, kPublic);
        } catch (err) {
            expect(err.message).to.equal(codes.NOTE_VALUE_TOO_BIG);
        }
    });
});
