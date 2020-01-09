import { constants } from '@aztec/dev-utils';
import { expect } from 'chai';
import crypto from 'crypto';
import sinon from 'sinon';
import BN from 'bn.js';
import * as bn128 from '../src';

describe('bn128', () => {
    let kMaxStub;

    beforeEach(() => {
        kMaxStub = sinon.stub(constants, 'K_MAX').value(500);
    });

    afterEach(() => {
        kMaxStub.restore();
    });

    it('should export the bn128 curve', async () => {
        const testPoint = bn128.randomPoint();
        const scalar = new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
        const scalarInverse = scalar.redInvm();
        const result = testPoint.mul(scalar).mul(scalarInverse);
        expect(result.eq(testPoint));
        expect(
            testPoint.x
                .redSqr()
                .redMul(testPoint.x)
                .redAdd(bn128.curve.b)
                .eq(testPoint.y.redSqr()),
        ).to.equal(true);
    });

    it('should create a well-formed bn.js instance in randomScalarGroup', () => {
        const scalar = bn128.randomGroupScalar();

        expect(BN.isBN(scalar)).to.equal(true);
        expect(scalar.red).to.deep.equal(bn128.groupReduction);
        expect(scalar.fromRed().toString(16).length <= 64).to.equal(true);
    });

    it('should create a well-formed elliptic.js point instance in randomPoint', () => {
        for (let i = 0; i < 10; i += 1) {
            const point = bn128.randomPoint();
            const lhs = point.y.redSqr();
            const rhs = point.x
                .redSqr()
                .redMul(point.x)
                .redAdd(bn128.curve.b);
            expect(lhs.fromRed().eq(rhs.fromRed())).to.equal(true);
        }
    });

    it('should correctly represent the AZTEC generator point h', () => {
        const { h } = bn128;
        const lhs = h.y.redSqr();
        const rhs = h.x
            .redSqr()
            .redMul(h.x)
            .redAdd(bn128.curve.b);

        expect(h.x.fromRed().eq(bn128.H_X)).to.equal(true);
        expect(h.y.fromRed().eq(bn128.H_Y)).to.equal(true);
        expect(lhs.fromRed().eq(rhs.fromRed())).to.equal(true);
    });

    describe('Recover Message', async () => {
        it('should recover a note message', async () => {
            const k = new BN(300);
            const gamma = bn128.curve.g;
            const gammaK = bn128.curve.g.mul(k);
            const result = await bn128.recoverMessage(gamma, gammaK);
            expect(result).to.equal(300);
        });

        it('should return 1 for point at infinity', async () => {
            const gamma = bn128.curve.g.add(bn128.curve.g.neg());
            const gammaK = gamma;
            const result = await bn128.recoverMessage(gamma, gammaK);
            expect(result).to.equal(1);
        });

        it('should fail cannot find a solution from 0 to K_MAX', async () => {
            const k = new BN(999);
            const gamma = bn128.curve.g;
            const gammaK = bn128.curve.g.mul(k);
            try {
                await bn128.recoverMessage(gamma, gammaK);
            } catch (e) {
                expect(e.message).to.contain('could not find k!');
            }
        });
    });
});
