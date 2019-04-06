/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const path = require('path');
const BN = require('bn.js');

const { Runtime } = require('../../huff');
const bn128Reference = require('../js_snippets/bn128_reference');
const {
    generatePointData,
    sliceMemory,
    referenceCurve,
    generateCalldata,
} = require('../js_snippets/utils');

const { expect } = chai;
const { pRed } = bn128Reference;

const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

const { n, nRed } = bn128Reference;
// NOTE: potential areas to improve
// 1: main loop is garbage, too many special case tests
// 2: P macro used too often, huge bytecode bload
// 3: not sure we need to use 'mod' in PRECOMPUTE_TABLE__RESCALE_15, just subtract from 4p when we need to negate?

describe('bn128 main loop', function describe() {
    this.timeout(10000);
    let main;
    before(async () => {
        main = new Runtime('main_loop.huff', pathToTestData, true);
    });

    it('macro WEIERSTRUDEL__MAIN correctly identifies whether edge case in addition formula is met', async () => {
        // ok, so I want a set of points that sum to zero
        // but...not in an obvious manner? Although this will all get
        // scrambled because of our short basis vectors

        // r3P3 = -r1P1 -rrP2
        // r3P3 + r2P2 + r1P1 = 0
        // r3a3.G + r2a2.G + r1a1.G = 0
        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const points = [
            referenceCurve.g.mul(scalars[0]),
            referenceCurve.g.mul(scalars[1]),
            referenceCurve.g.mul(scalars[2]),
        ];
        const newScalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const inverse = scalars[2].toRed(nRed).redInvm().fromRed();
        const finalScalar = n.sub((scalars[0].mul(newScalars[0]))
            .add(scalars[1].mul(newScalars[1])).umod(n))
            .mul(inverse).umod(n);
        newScalars.push(finalScalar);

        const sanityPoint = points[0].mul(newScalars[0])
            .add(points[1].mul(newScalars[1]))
            .add(points[2].mul(newScalars[2]));
        expect(sanityPoint.isInfinity()).to.equal(true);

        const { calldata } = generateCalldata(
            points.map(point => ({ x: point.x.fromRed(), y: point.y.fromRed() })),
            newScalars
        );
        try {
            const { stack } = await main('WEIERSTRUDEL__MAIN_EXCEPTION_TEST', [], [], calldata);
            stack.forEach((s) => { console.log(s.toString(16)); });
            expect(true).to.equal(false); // hmm
        } catch (e) {
            expect(e.error).to.equal('revert');
        }
    });


    it('macro WEIERSTRUDEL__MAIN uses complete addition formulae', async () => {
        // ok, so I want a set of points that sum to zero
        // but...not in an obvious manner? Although this will all get
        // scrambled because of our short basis vectors

        // r3P3 = -r1P1 -rrP2
        // r3P3 + r2P2 + r1P1 = 0
        // r3a3.G + r2a2.G + r1a1.G = 0
        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const points = [
            referenceCurve.g.mul(scalars[0]),
            referenceCurve.g.mul(scalars[1]),
            referenceCurve.g.mul(scalars[2]),
        ];
        const newScalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const inverse = scalars[2].toRed(nRed).redInvm().fromRed();
        const finalScalar = n.sub((scalars[0].mul(newScalars[0]))
            .add(scalars[1].mul(newScalars[1])).umod(n))
            .mul(inverse).umod(n);
        newScalars.push(finalScalar);

        const sanityPoint = points[0].mul(newScalars[0])
            .add(points[1].mul(newScalars[1]))
            .add(points[2].mul(newScalars[2]));
        expect(sanityPoint.isInfinity()).to.equal(true);

        const { calldata } = generateCalldata(
            points.map(point => ({ x: point.x.fromRed(), y: point.y.fromRed() })),
            newScalars
        );
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        expect(stack.length).to.equal(0);
        expect(returnWords[0].eq(new BN(0))).to.equal(true);
        expect(returnWords[1].eq(new BN(1))).to.equal(true);
        expect(returnWords[2].eq(new BN(0))).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of ONE point', async () => {
        const { calldata, expected } = generatePointData(1);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });


    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of TWO points', async () => {
        const { calldata, expected } = generatePointData(2);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of THREE points', async () => {
        const { calldata, expected } = generatePointData(3);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of FOUR points', async () => {
        const { calldata, expected } = generatePointData(4);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of FIVE points', async () => {
        const { calldata, expected } = generatePointData(5);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of SIX points', async () => {
        const { calldata, expected } = generatePointData(6);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of SEVEN points', async () => {
        const { calldata, expected } = generatePointData(7);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of EIGHT points', async () => {
        const { calldata, expected } = generatePointData(8);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of NINE points', async () => {
        const { calldata, expected } = generatePointData(9);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of TEN points', async () => {
        const { calldata, expected } = generatePointData(10);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of ELEVEN points', async () => {
        const { calldata, expected } = generatePointData(11);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });


    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of TWLEVE points', async () => {
        const { calldata, expected } = generatePointData(12);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of THIRTEEN points', async () => {
        const { calldata, expected } = generatePointData(13);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of FOURTEEN points', async () => {
        const { calldata, expected } = generatePointData(14);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro WEIERSTRUDEL__MAIN calculates scalar multiplication of FIFTEEN points', async () => {
        const { calldata, expected } = generatePointData(15);
        const { stack, returnValue } = await main('WEIERSTRUDEL__MAIN', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });
        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });
});
