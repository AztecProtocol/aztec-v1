const chai = require('chai');

const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;

const testHelper = `
#include "./easm_modules/add.easm"
#include "./easm_modules/constants.easm"
#define X2 = takes(0) returns(1) { 0x20 }
#define Y2 = takes(0) returns(1) { 0x00 }
#define PRECOMPUTE_TABLE_ADD_IMPL = takes(3) returns(11) {
    PRECOMPUTE_TABLE_ADD<P,P,P,X2,Y2>()
}

#define P2_LOCATION_TEST = takes(0) returns(3) {
    0x00
    0x20
}

#define ADD_MAIN_IMPL = takes(3) returns(3) {
    ADD_MAIN<P2_LOCATION_TEST,P,2P>()
}
`;


describe('bn128 add', () => {
    let add;
    before(() => {
        add = new Runtime(testHelper);
    });
    it('macro PRECOMPUTE_TABLE_ADD correctly calculates point addition', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const { x: x1, y: y1, z: z1 } = bn128Reference.randomPointJacobian();
        const { zz, zzz } = bn128Reference.zFactors({ x2, y2 }, { x1, y1, z1 });

        const initialMemory = [{
            index: 32,
            value: bn128Reference.p.sub(x2),
        }, {
            index: 0,
            value: y2,
        }];
        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, z1);
        const { stack } = await add('PRECOMPUTE_TABLE_ADD_IMPL', [x1, bn128Reference.p.sub(y1), z1], initialMemory);
        expect(stack.length).to.equal(11);
        const [x1Out, y1Out, pA, zzzOut, pB, pC, zzOut, pD, x3, y3, z3] = stack;
        expect(pA.eq(bn128Reference.p)).to.equal(true);
        expect(pB.eq(bn128Reference.p)).to.equal(true);
        expect(pC.eq(bn128Reference.p)).to.equal(true);
        expect(pD.eq(bn128Reference.p)).to.equal(true);
        expect(x1Out.umod(pA).eq(x1)).to.equal(true);
        expect(y1Out.umod(pA).eq(pA.sub(y1))).to.equal(true);
        expect(x3.umod(pA).eq(reference.x)).to.equal(true);
        expect(y3.umod(pA).eq(pA.sub(reference.y))).to.equal(true);
        expect(z3.umod(pA).eq(reference.z)).to.equal(true);
        expect(zzOut.umod(pA).eq(zz)).to.equal(true);
        expect(zzzOut.umod(pA).eq(zzz)).to.equal(true);
    });

    it('macro ADD_MAIN correctly caluclates mixed coordinate point addition', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const { x: x1, y: y1, z: z1 } = bn128Reference.randomPointJacobian();
        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, z1);
        const y1Neg = bn128Reference.p.sub(y1);
        const x2Neg = bn128Reference.p.sub(x2);
        const initialMemory = [{
            index: 0,
            value: x2Neg,
        }, {
            index: 32,
            value: y2,
        }];
        const { stack } = await add('ADD_MAIN_IMPL', [x1, y1Neg, z1], initialMemory);
        expect(stack.length).to.equal(3);
        const [x3, y3, z3] = stack;
        expect(x3.umod(bn128Reference.p).eq(reference.x)).to.equal(true);
        expect(y3.umod(bn128Reference.p).eq(bn128Reference.p.sub(reference.y))).to.equal(true);
        expect(z3.umod(bn128Reference.p).eq(reference.z)).to.equal(true);
    });
});
