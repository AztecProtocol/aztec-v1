const chai = require('chai');
const crypto = require('crypto');

const BN = require('bn.js');
const bn128 = require('../../bn128/bn128');
const { H_X, H_Y } = require('../../params');

const { expect } = chai;

describe('bn128 tests', () => {
    let kMaxTemp;
    beforeEach(() => {
        kMaxTemp = bn128.K_MAX;
        bn128.K_MAX = 500; // *cough*
    });

    afterEach(() => {
        bn128.K_MAX = kMaxTemp;
    });

    it('curve exports the bn128 curve', async () => {
        const testPoint = bn128.randomPoint();
        const scalar = new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
        const scalarInverse = scalar.redInvm();
        const result = testPoint.mul(scalar).mul(scalarInverse);
        expect(result.eq(testPoint));
        expect(testPoint.x.redSqr().redMul(testPoint.x).redAdd(bn128.b).eq(testPoint.y.redSqr())).to.equal(true);
    });

    it('random group scalar creates well-formed BN instance', () => {
        const scalar = bn128.randomGroupScalar();

        expect(BN.isBN(scalar)).to.equal(true);
        expect(scalar.red).to.deep.equal(bn128.groupReduction);
        expect(scalar.fromRed().toString(16).length <= 64).to.equal(true);
    });

    it('random point creates well-formed elliptic.js point instance', () => {
        for (let i = 0; i < 10; i += 1) {
            const point = bn128.randomPoint();
            const lhs = point.y.redSqr();
            const rhs = point.x.redSqr().redMul(point.x).redAdd(bn128.b);
            expect(lhs.fromRed().eq(rhs.fromRed())).to.equal(true);
        }
    });

    it('AZTEC generator point h is correctly represented', () => {
        const { h } = bn128;
        const lhs = h.y.redSqr();
        const rhs = h.x.redSqr().redMul(h.x).redAdd(bn128.b);

        expect(h.x.fromRed().eq(H_X)).to.equal(true);
        expect(h.y.fromRed().eq(H_Y)).to.equal(true);
        expect(lhs.fromRed().eq(rhs.fromRed())).to.equal(true);
    });

    it('recoverMessage correctly recovers a note message', () => {
        const k = new BN(300);
        const gamma = bn128.g;
        const gammaK = bn128.g.mul(k);
        expect(bn128.recoverMessage(gamma, gammaK)).to.equal(300);
    });

    it('recoverMessage returns 1 for point at infinity', () => {
        const gamma = bn128.g.add(bn128.g.neg());
        const gammaK = gamma;
        expect(bn128.recoverMessage(gamma, gammaK)).to.equal(1);
    });

    it('recoverMessage will throw if cannot find a solution from 0 to K_MAX', () => {
        const k = new BN(999);
        const gamma = bn128.g;
        const gammaK = bn128.g.mul(k);
        try {
            bn128.recoverMessage(gamma, gammaK);
        } catch (e) {
            expect(e.message).to.equal('could not find k!');
        }
    });
});
