const chai = require('chai');
const crypto = require('crypto');

const BN = require('bn.js');
const bn128 = require('./bn128');


const { expect } = chai;

// TODO add more tests
describe('bn128 tests', () => {
    it('curve exports the bn128 curve', async () => {
        const testPoint = bn128.randomPoint();
        const scalar = new BN(crypto.randomBytes(32), 16).toRed(bn128.groupReduction);
        const scalarInverse = scalar.redInvm();
        const result = testPoint.mul(scalar).mul(scalarInverse);
        expect(result.eq(testPoint));
        expect(testPoint.x.redSqr().redMul(testPoint.x).redAdd(bn128.b).eq(testPoint.y.redSqr())).to.equal(true);
    });
});
