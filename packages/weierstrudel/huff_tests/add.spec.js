const chai = require('chai');
const path = require('path');
const BN = require('bn.js');

const { Runtime } = require('../../huff');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;
const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

const testHelper = `
#include "add.huff"
#include "constants.huff"
#define macro ADD__PRECOMPUTE_TABLE_IMPL = takes(3) returns(11) {
    ADD__PRECOMPUTE_TABLE<2P,P,P,P,X2,Y2>()
}

#define macro P2_LOCATION_TEST = takes(0) returns(3) {
    0x00
    0x20
}

#define macro ADD__MAIN_IMPL = takes(3) returns(3) {
    ADD__MAIN<P2_LOCATION_TEST,P,2P>()
}

#define macro ADD__MAIN_EXCEPTION_IMPL = takes(3) returns(3) {
    exception_label pop
    ADD__MAIN_WITH_EXCEPTION<P2_LOCATION_TEST,P,2P,exception_label>()
    exception_label:
}

#define macro ADD__AFFINE_IMPL = takes(5) returns(11) {
    ADD__AFFINE<X2,Y2,P,2P>()
} 
`;

const { p } = bn128Reference;

describe('bn128 add', () => {
    let add;
    before(() => {
        add = new Runtime(testHelper, pathToTestData, false);
    });

    it('macro ADD__PRECOMPUTE_TABLE correctly calculates point addition', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const { x: x1, y: y1, z: z1 } = bn128Reference.randomPointJacobian();
        const { zz, zzz } = bn128Reference.zFactors({ x2, y2 }, { x1, y1, z1 });

        const initialMemory = [{
            index: 0,
            value: bn128Reference.p.sub(x2),
        }, {
            index: 32,
            value: y2,
        }];
        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, z1);
        const { stack } = await add('ADD__PRECOMPUTE_TABLE_IMPL', [x1, bn128Reference.p.sub(y1), z1], initialMemory, []);
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

    it('macro ADD__MAIN_WITH_EXCEPTION will correctly perform addition if P1 == -P2', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const z1 = bn128Reference.randomFieldElement();
        const zz = z1.sqr().umod(p);
        const zzz = zz.mul(z1).umod(p);
        // x2z1z1 = x1
        // y2z1z1z1 = y1
        const x1 = x2.mul(zz).umod(p);
        const y1 = p.sub(y2.mul(zzz).umod(p));

        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, z1);
        // bn128.reference doesn't test exceptions - z-coord should be zero
        expect(reference.z.eq(new BN(0))).to.equal(true);

        const y1Neg = bn128Reference.p.sub(y1);
        const x2Neg = bn128Reference.p.sub(x2);
        const initialMemory = [{
            index: 0,
            value: x2Neg,
        }, {
            index: 32,
            value: y2,
        }];
        const { stack } = await add('ADD__MAIN_EXCEPTION_IMPL', [p, p, p, x1, y1Neg, z1], initialMemory, []);
        expect(stack.length).to.equal(6);
        const [x3, y3, z3] = stack.slice(-3);
        expect(x3.eq(new BN(0))).to.equal(true);
        expect(y3.eq(new BN(1))).to.equal(true);
        expect(z3.eq(new BN(0))).to.equal(true);
    });

    it('macro ADD__MAIN_WITH_EXCEPTION will correctly perform addition if P1 == P2', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const z1 = bn128Reference.randomFieldElement();
        const zz = z1.sqr().umod(p);
        const zzz = zz.mul(z1).umod(p);
        // x2z1z1 = x1
        // y2z1z1z1 = y1
        const x1 = x2.mul(zz).umod(p);
        const y1 = y2.mul(zzz).umod(p);

        const reference = bn128Reference.double(x1, y1, z1);
        // bn128.reference doesn't test exceptions - z-coord should be zero

        const y1Neg = bn128Reference.p.sub(y1);
        const x2Neg = bn128Reference.p.sub(x2);
        const initialMemory = [{
            index: 0,
            value: x2Neg,
        }, {
            index: 32,
            value: y2,
        }];
        const { stack } = await add(
            'ADD__MAIN_EXCEPTION_IMPL',
            [p.add(p).add(p), p.add(p), p, new BN(0), new BN(0), x1, y1Neg, z1],
            initialMemory,
            []
        );
        expect(stack.length).to.equal(8);
        const [x3, y3, z3] = stack.slice(-3);
        expect(x3.umod(p).eq(reference.x)).to.equal(true);
        expect(y3.umod(p).eq(p.sub(reference.y))).to.equal(true);
        expect(z3.umod(p).eq(reference.z)).to.equal(true);
    });

    it('macro ADD__MAIN_WITH_EXCEPTION will correctly perform addition if P1 = infinity', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const x1 = new BN(0);
        const y1 = new BN(1);
        const z1 = new BN(0);
        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, z1);
        // bn128.reference doesn't test exceptions - z-coord should be zero
        expect(reference.z.eq(new BN(0))).to.equal(true);

        const x2Neg = bn128Reference.p.sub(x2);
        const initialMemory = [{
            index: 0,
            value: x2Neg,
        }, {
            index: 32,
            value: y2,
        }];
        const { stack } = await add('ADD__MAIN_EXCEPTION_IMPL', [p, p, p, x1, y1, z1], initialMemory, []);
        expect(stack.length).to.equal(6);
        const [x3, y3, z3] = stack.slice(-3);
        expect(x3.eq(x2)).to.equal(true);
        expect(y3.eq(p.sub(y2))).to.equal(true);
        expect(z3.eq(new BN(1))).to.equal(true);
    });

    it('macro ADD__MAIN correctly caluclates mixed coordinate point addition', async () => {
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
        const { stack } = await add('ADD__MAIN_IMPL', [x1, y1Neg, z1], initialMemory, []);

        expect(stack.length).to.equal(3);
        const [x3, y3, z3] = stack;
        expect(x3.umod(bn128Reference.p).eq(reference.x)).to.equal(true);
        expect(y3.umod(bn128Reference.p).eq(bn128Reference.p.sub(reference.y))).to.equal(true);
        expect(z3.umod(bn128Reference.p).eq(reference.z)).to.equal(true);
    });

    it('macro ADD__AFFINE correctly calculates affine point addition', async () => {
        const { x: x1, y: y1 } = bn128Reference.randomPoint();
        const { x: x2, y: y2 } = bn128Reference.randomPoint();

        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, new BN(1));

        const x2Neg = bn128Reference.p.sub(x2);
        const { zz, zzz } = bn128Reference.zFactors({ x2, y2 }, { x1, y1, z1: new BN(1) });
        const initialMemory = [{
            index: 0,
            value: x2Neg,
        }, {
            index: 32,
            value: y2,
        }];
        const { stack } = await add('ADD__AFFINE_IMPL', [x1, p.sub(y1)], initialMemory, []);
        const [x1Out, y1Out, pA, zzzOut, pB, pC, zzOut, pD, x3, y3, z3] = stack;

        expect(stack.length).to.equal(11);
        expect(pA.eq(bn128Reference.p)).to.equal(true);
        expect(pB.eq(bn128Reference.p)).to.equal(true);
        expect(pC.eq(bn128Reference.p)).to.equal(true);
        expect(pD.eq(bn128Reference.p)).to.equal(true);
        expect(zzOut.umod(pA).eq(zz)).to.equal(true);
        expect(zzzOut.umod(pA).eq(zzz)).to.equal(true);
        expect(x1Out.umod(pA).eq(x1)).to.equal(true);
        expect(y1Out.umod(pA).eq(pA.sub(y1))).to.equal(true);
        expect(x3.umod(pA).eq(reference.x)).to.equal(true);
        expect(y3.umod(pA).eq(pA.sub(reference.y))).to.equal(true);
        expect(z3.umod(pA).eq(reference.z)).to.equal(true);
    });
});
