const chai = require('chai');
const BN = require('bn.js');
const path = require('path');
const Runtime = require('./runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { p } = bn128Reference;
const { expect } = chai;

const pathToTestData = path.posix.resolve(__dirname, './testData');

const testHelper = `
#include "double.huff"
#include "constants.huff"
#define DOUBLE_MAIN_IMPL = takes(3) returns(3) {
    DOUBLE_MAIN<P,P>()
}

#define X2 = takes(0) returns(1) { 0x00 }
#define Y2 = takes(0) returns(1) { 0x20 }
#define Z2 = takes(0) returns(1) { 0x40 }

#define PRECOMPUTE_TABLE_DOUBLE_B_IMPL = takes(3) returns(3) {
    PRECOMPUTE_TABLE_DOUBLE_B<P,P,X2,Y2,Z2>()
}
`;


function sliceMemory(memArray) {
    const numWords = Math.ceil(memArray.length / 32);
    const result = [];
    for (let i = 0; i < numWords * 32; i += 32) {
        result.push(new BN(memArray.slice(i, i + 32), 16));
    }
    return result;
}

describe('runtime tests using double algorithm', () => {
    let double;
    before(() => {
        double = new Runtime(testHelper, pathToTestData);
    });
    it('macro DOUBLE correctly calculates point doubling', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const { stack } = await double('DOUBLE', [bn128Reference.p, x, y, z]);
        const reference = bn128Reference.double(x, y, z);
        const [pOut, xOut, yOut, zOut] = stack;
        expect(pOut.eq(bn128Reference.p));

        // results are overloaded, normalize before comparison
        expect(xOut.umod(pOut).eq(reference.x)).to.equal(true);
        expect(yOut.umod(pOut).eq(reference.y)).to.equal(true);
        expect(zOut.umod(pOut).eq(reference.z)).to.equal(true);
    });

    it('macro PRECOMPUTE_TABLE_DOUBLE_B correctly calculates point doubling', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const reference = bn128Reference.double(x, y, z);

        const { stack, memory } = await double('PRECOMPUTE_TABLE_DOUBLE_B_IMPL', [z, x, y]);
        const slicedMemory = sliceMemory(memory);
        expect(slicedMemory.length).to.equal(3);
        expect(stack.length).to.equal(4);
        const [z1, x1, y1, z2] = stack;
        const [x2, y2, z2Mem] = slicedMemory;

        // results are overloaded, normalize before comparison
        expect(x1.eq(x)).to.equal(true);
        expect(y1.eq(y)).to.equal(true);
        expect(z1.eq(z)).to.equal(true);
        expect(x2.umod(p).eq(p.sub(reference.x))).to.equal(true);
        expect(y2.umod(p).eq(reference.y)).to.equal(true);
        expect(z2.umod(p).eq(reference.z)).to.equal(true);
        expect(z2Mem.eq(z2)).to.equal(true);
    });


    it('macro DOUBLE_MAIN correctly calculates point doubling (inverted y)', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const yNeg = bn128Reference.p.sub(y);
        const { stack } = await double('DOUBLE_MAIN_IMPL', [x, yNeg, z]);
        const reference = bn128Reference.double(x, y, z);
        const [xOut, yOut, zOut] = stack;

        // results are overloaded, normalize before comparison
        expect(xOut.umod(bn128Reference.p).eq(reference.x)).to.equal(true);
        expect(yOut.umod(bn128Reference.p).eq(bn128Reference.p.sub(reference.y))).to.equal(true);
        expect(zOut.umod(bn128Reference.p).eq(reference.z)).to.equal(true);
    });
});
