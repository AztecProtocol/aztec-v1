const chai = require('chai');
const BN = require('bn.js');
const crypto = require('crypto');
const EC = require('elliptic');
const path = require('path');

const { Runtime } = require('../../huff');
const {
    n,
    lambda,
    p,
    beta,
    randomPoint,
} = require('../js_snippets/bn128_reference');
const { endoSplit } = require('../js_snippets/endomorphism');

const golangVectors = require('./test_vectors');

const { expect } = chai;
const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

// eslint-disable-next-line new-cap
const referenceCurve = new EC.curve.short({
    a: '0',
    b: '3',
    p: p.toString(16),
    n: n.toString(16),
    gRed: false,
    g: ['1', '2'],
});

describe('endomorphism split', () => {
    let endomorphism;
    before(() => {
        endomorphism = new Runtime('endomorphism.huff', pathToTestData);
    });

    it('macro ENDOMORPHISM correctly splits scalar k into half-length scalars k1, k2', async () => {
        const k = new BN(crypto.randomBytes(32), 16).umod(n);
        const { stack } = await endomorphism('ENDOMORPHISM', [k]);
        expect(stack.length).to.equal(2);
        expect(stack[1].sub(stack[0].mul(lambda)).umod(n).eq(k.umod(n))).to.equal(true);
        expect(stack[1].bitLength() <= 127).to.equal(true);
        expect(stack[0].bitLength() <= 127).to.equal(true);

        const pointData = randomPoint();

        const point = referenceCurve.point(pointData.x, pointData.y);

        const endoPoint = referenceCurve.point(
            pointData.x.mul(beta).umod(p),
            p.sub(pointData.y)
        );

        const expected = point.mul(k);

        const result = point.mul(stack[1]).add(endoPoint.mul(stack[0]));
        expect(result.eq(expected)).to.equal(true);
    });

    it('js endomorphism will reduce golang test vectors', async () => {
        golangVectors.forEach(({ scalar }) => {
            const { k1, k2 } = endoSplit(scalar.umod(n));
            expect(k1.sub(k2.mul(lambda)).umod(n).eq(scalar.umod(n))).to.equal(true);
            expect(k1.bitLength() <= 127).to.equal(true);
            expect(k2.bitLength() <= 127).to.equal(true);
        });
    });

    it('macro ENDOMORPHSIM correctly splits scalars from golang vectors', async () => {
        const testPromises = golangVectors.map(({ scalar }) => {
            return endomorphism('ENDOMORPHISM', [scalar]);
        });
        const results = await Promise.all(testPromises);
        results.forEach(({ stack }, i) => {
            const reference = golangVectors[i];
            expect(stack.length).to.equal(2);
            expect(stack[1].sub(stack[0].mul(lambda)).umod(n).eq(reference.scalar.umod(n))).to.equal(true);
            expect(stack[1].bitLength() <= 128).to.equal(true);
            expect(stack[0].bitLength() <= 128).to.equal(true);
            const point = referenceCurve.point(reference.point.x, reference.point.y);

            const endoPoint = referenceCurve.point(
                reference.point.x.mul(beta).umod(p),
                p.sub(reference.point.y)
            );

            const expected = point.mul(reference.scalar);

            const result = point.mul(stack[1]).add(endoPoint.mul(stack[0]));
            expect(result.eq(expected)).to.equal(true);
        });
    });
});
