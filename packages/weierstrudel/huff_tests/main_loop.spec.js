/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const BN = require('bn.js');
const EC = require('elliptic');
const path = require('path');
const fs = require('fs');

const { Runtime } = require('../../huff');
const bn128Reference = require('../js_snippets/bn128_reference');
const { generatePointData, sliceMemory } = require('../js_snippets/utils');

const { expect } = chai;
const { p, pRed, n } = bn128Reference;

const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of ONE point', async () => {
        const { calldata, expected } = generatePointData(1);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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


    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of TWO points', async () => {
        const { calldata, expected } = generatePointData(2);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of THREE points', async () => {
        const { calldata, expected } = generatePointData(3);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of FOUR points', async () => {
        const { calldata, expected } = generatePointData(4);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of FIVE points', async () => {
        const { calldata, expected } = generatePointData(5);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of SIX points', async () => {
        const { calldata, expected } = generatePointData(6);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of SEVEN points', async () => {
        const { calldata, expected } = generatePointData(7);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of EIGHT points', async () => {
        const { calldata, expected } = generatePointData(8);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of NINE points', async () => {
        const { calldata, expected } = generatePointData(9);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of TEN points', async () => {
        const { calldata, expected } = generatePointData(10);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of ELEVEN points', async () => {
        const { calldata, expected } = generatePointData(11);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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


    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of TWLEVE points', async () => {
        const { calldata, expected } = generatePointData(12);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of THIRTEEN points', async () => {
        const { calldata, expected } = generatePointData(13);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of FOURTEEN points', async () => {
        const { calldata, expected } = generatePointData(14);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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

    it('macro MAIN__WEIERSTRUDEL calculates scalar multiplication of FIFTEEN points', async () => {
        const { calldata, expected } = generatePointData(15);
        const { stack, returnValue } = await main('MAIN__WEIERSTRUDEL', [], [], calldata, 1);
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
