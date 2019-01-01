const chai = require('chai');
const BN = require('bn.js');
const path = require('path');

const Runtime = require('../huff/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { p } = bn128Reference;
const { expect } = chai;

const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

const testHelper = `
#include "double.huff"
#include "constants.huff"
#define DOUBLE_MAIN_IMPL = takes(3) returns(3) {
    DOUBLE_MAIN<P,P>()
}

#define PRECOMPUTE_TABLE_DOUBLE_IMPL = takes(3) returns(3) {
    PRECOMPUTE_TABLE_DOUBLE<dup4,dup5,X2,Y2,Z2>()
}

#define DOUBLE_AFFINE_IMPL = takes(3) returns(3) {
    DOUBLE_AFFINE<0x00,0x20,0x40,dup3,dup4,dup5,dup10>()
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

describe('bn128 double', () => {
    let double;
    before(() => {
        double = new Runtime(testHelper, pathToTestData);
    });

    it('macro PRECOMPUTE_TABLE_DOUBLE correctly calculates point doubling', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const reference = bn128Reference.double(x, y, z);
        const p3 = p.mul(new BN(3));
        const { stack, memory } = await double('PRECOMPUTE_TABLE_DOUBLE_IMPL', [p3, p, z, x, y]);
        const slicedMemory = sliceMemory(memory);
        expect(slicedMemory.length).to.equal(3);
        expect(stack.length).to.equal(6);
        const [p3Out, pOut, z1, x1, y1, z2] = stack;
        const [x2, y2, z2Mem] = slicedMemory;

        // results are overloaded, normalize before comparison
        expect(p3Out.eq(p3)).to.equal(true);
        expect(pOut.eq(p)).to.equal(true);
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

    it('macro DOUBLE_AFFINE_SHORT correctly calculates point doubling', async () => {
        const { x, y } = bn128Reference.randomPoint();
        const ppp = bn128Reference.p.mul(new BN(3));
        const { stack, memory } = await double('DOUBLE_AFFINE_IMPL', [ppp, p, x, y]);
        const reference = bn128Reference.double(x, y, new BN(1));
        const slicedMemory = sliceMemory(memory);
        expect(slicedMemory.length).to.equal(3);
        const [x1, y1, z1] = slicedMemory;

        // results are overloaded, normalize before comparison
        expect(z1.umod(p).eq(reference.z)).to.equal(true);
        expect(y1.umod(p).eq(reference.y)).to.equal(true);
        expect(x1.umod(p).eq(p.sub(reference.x))).to.equal(true);
        expect(stack.length).to.equal(4);
    });
});
