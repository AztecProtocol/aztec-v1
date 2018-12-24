const chai = require('chai');
const BN = require('bn.js');
const EC = require('elliptic');

const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');


const {
    beta,
    p,
    pRed,
    n,
} = bn128Reference;
const { expect } = chai;

// eslint-disable-next-line new-cap
const referenceCurve = new EC.curve.short({
    a: '0',
    b: '3',
    p: p.toString(16),
    n: n.toString(16),
    gRed: false,
    g: ['1', '2'],
});


function getComparisonTable(x, y, z) {
    const normalized = bn128Reference.toAffine({ x, y, z });
    const point = referenceCurve.point(normalized.x.fromRed(), normalized.y.fromRed());
    const table = [point];
    for (let i = 1; i < 8; i += 1) {
        table[i] = point.mul(new BN((i * 2) + 1));
    }
    return table;
}


function sliceMemory(memArray, numWords) {
    if (memArray.length !== numWords * 32) {
        throw new Error(`memory legth ${memArray.length} does not map to ${numWords} words (${numWords * 32})`);
    }
    const result = [];
    for (let i = 0; i < numWords * 32; i += 32) {
        result.push(new BN(memArray.slice(i, i + 32), 16));
    }
    return result;
}

function splitPoint(x, y) {
    return {
        x: p.sub(x),
        xEndo: p.sub(x).mul(beta).umod(p),
        yNeg: y,
        y: p.sub(y),
    };
}

const helperMacros = `
#include "precompute_table.huff"
#define RESCALE_15_WRAPPER = takes(3) returns(0) {
    RESCALE_15<dup3,dup2,0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define RESCALE_13_WRAPPER = takes(7) returns(0) {
    RESCALE_13<dup4,0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define RESCALE_WRAPPER = takes(11) returns(0) {
    RESCALE<dup4,0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define RESCALE_15_TRANSITION_WRAPPER = takes(5) returns(0) {
    RESCALE_15_TRANSITION<0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}
/*#define RESCALE_ITERATION_WRAPPER = takes(59) returns(0) {
    RESCALE_15<dup3,0x2c0,0x2e0,0x300,0x320,0xac0,0xae0,0xb00,0xb20>()
    RESCALE_13<dup4,0x280,0x2a0,0x340,0x360,0xa80,0xaa0,0xb40,0xb60>()
    RESCALE<dup4,0x240,0x260,0x380,0x3a0,0xa40,0xa60,0xb80,0xba0>()
    RESCALE<dup4,0x200,0x220,0x3c0,0x3e0,0xa00,0xa20,0xbc0,0xbe0>()
    RESCALE<dup4,0x1c0,0x1e0,0x400,0x420,0x9c0,0x9e0,0xc00,0xc20>()
    RESCALE<dup4,0x180,0x1a0,0x440,0x460,0x980,0x9a0,0xc40,0xc60>()
    RESCALE<dup4,0x140,0x160,0x480,0x4a0,0x940,0x960,0xc80,0xca0>()
    RESCALE<dup6,0x100,0x120,0x4c0,0x4e0,0x900,0x920,0xcc0,0xce0>()
}*/
`;

describe('bn128 precompute table two', () => {
    let precomputeTable;
    let templateWrapper;
    before(() => {
        precomputeTable = new Runtime('../huff_modules/precompute_table.huff');
        templateWrapper = new Runtime(helperMacros);
    });

    it('macro RESCALE_15 correctly performs point rescaling', async () => {
        const input = bn128Reference.randomPoint();
        const { stack, memory } = await templateWrapper(
            'RESCALE_15_WRAPPER',
            [p, input.x, input.y]
        );
        const expected = splitPoint(input.x, input.y);
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.yNeg)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.y)).to.equal(true);
        expect(stack.length).to.equal(1);
        expect(stack[0].eq(p)).to.equal(true);
    });

    it('macro RESCALE_13 correctly performs point rescaling', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await templateWrapper(
            'RESCALE_13_WRAPPER',
            [p, p1.x, p1.y, p, dz3[0], p, dz2[0]]
        );
        //             [ p, p1.x, p1.y, p, dz3[1], p, dz2[1], dz3[0], dz2[0]],
        const expected = splitPoint(
            p1.x.mul(dz2[0]).umod(p),
            p1.y.mul(dz3[0]).umod(p)
        );
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.yNeg)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.y)).to.equal(true);
        expect(stack.length).to.equal(3);
        expect(stack[0].eq(p)).to.equal(true);
        expect(stack[1].eq(dz2[0])).to.equal(true);
        expect(stack[2].eq(dz3[0])).to.equal(true);
    });

    it('macro RESCALE correctly performs point rescaling', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await templateWrapper(
            'RESCALE_WRAPPER',
            [p, p1.x, p1.y, p, dz3[0], p, p, dz2[0], p, dz2[1], dz3[1]]
        );
        const expected = splitPoint(
            p1.x.mul(dz2[0].mul(dz2[1]).umod(p)).umod(p),
            p1.y.mul(dz3[0].mul(dz3[1]).umod(p)).umod(p)
        );
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.yNeg)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.y)).to.equal(true);
        expect(stack.length).to.equal(3);
        expect(stack[0].eq(p)).to.equal(true);
        expect(stack[1].eq(dz2[0].mul(dz2[1]).umod(p))).to.equal(true);
        expect(stack[2].eq(dz3[0].mul(dz3[1]).umod(p))).to.equal(true);
    });

    it('macro RESCALE_15_TRANSITION correctly rescales x,y coordinates of new table entry on stack', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await templateWrapper(
            'RESCALE_15_TRANSITION_WRAPPER',
            [p, p1.x, p1.y, dz2[0], dz3[0]]
        );
        const expected = splitPoint(
            p1.x.mul(dz2[0]).umod(p),
            p1.y.mul(dz3[0]).umod(p)
        );
        const result = sliceMemory(memory, 8);
        expect(result[0].eq(expected.x)).to.equal(true);
        expect(result[1].eq(expected.y)).to.equal(true);
        expect(result[2].eq(expected.x));
        expect(result[3].eq(expected.yNeg)).to.equal(true);
        expect(result[4].eq(expected.xEndo)).to.equal(true);
        expect(result[5].eq(expected.yNeg)).to.equal(true);
        expect(result[6].eq(expected.xEndo)).to.equal(true);
        expect(result[7].eq(expected.y)).to.equal(true);
        expect(stack.length).to.equal(3);
        expect(stack[0].eq(p)).to.equal(true);
        expect(stack[1].eq(dz2[0])).to.equal(true);
        expect(stack[2].eq(dz3[0])).to.equal(true);
    });

    it('macro PRECOMPUTE_TABLE_SINGLE_AFFINE calculates coordinates and scaling factors for affine point', async () => {
        const point = bn128Reference.randomPoint();
        point.z = new BN(1);
        const { tables: [{ table, zFactors, tableZ }] } = bn128Reference.generateTable([point]);
        const reference = table.map(({ x, y, z }) => ({ x: x.fromRed(), y: y.fromRed(), z: z.fromRed() }));
        const dz = zFactors.map(z => z.fromRed());

        const { stack } = await precomputeTable('PRECOMPUTE_TABLE_SINGLE_AFFINE', [point.x, point.y]);
        for (let i = 0; i < reference.length; i += 1) {
            const stackIndex = (i * 8);
            const expected = reference[i];
            expect(expected.x.eq(stack[stackIndex].umod(p))).to.equal(true);
            expect(p.sub(expected.y).eq(stack[stackIndex + 1].umod(p))).to.equal(true);
            if (i < reference.length - 1) {
                const u = dz[i];
                const zz = u.mul(u).umod(p);
                const zzz = zz.mul(u).umod(p);
                expect(stack[stackIndex + 2].eq(p)).to.equal(true);
                expect(stack[stackIndex + 3].umod(p).eq(zzz)).to.equal(true);
                expect(stack[stackIndex + 4].eq(p)).to.equal(true);
                expect(stack[stackIndex + 5].eq(p)).to.equal(true);
                expect(stack[stackIndex + 6].umod(p).eq(zz)).to.equal(true);
                expect(stack[stackIndex + 7].eq(p)).to.equal(true);
            }
        }
        const { x: x15, y: y15 } = reference[reference.length - 1];
        const z15 = tableZ;
        expect(stack[stack.length - 3].umod(p).eq(x15)).to.equal(true);
        expect(stack[stack.length - 2].umod(p).eq(p.sub(y15))).to.equal(true);
        expect(stack[stack.length - 1].umod(p).eq(z15)).to.equal(true);
        expect(stack.length === 59);
    });


    it('macro PRECOMPUTE_TABLE_SINGLE_AFFINE_FINAL calculates coordinates and scaling factors for affine point', async () => {
        const point = bn128Reference.randomPoint();
        point.z = new BN(1);
        const { tables: [{ table, zFactors, tableZ }] } = bn128Reference.generateTable([point]);
        const reference = table.map(({ x, y, z }) => ({ x: x.fromRed(), y: y.fromRed(), z: z.fromRed() }));
        const dz = zFactors.map(z => z.fromRed());

        const { stack } = await precomputeTable('PRECOMPUTE_TABLE_SINGLE_AFFINE_FINAL', [point.x, point.y]);
        for (let i = 0; i < reference.length - 1; i += 1) {
            const stackIndex = (i * 8);
            const expected = reference[i];
            expect(expected.x.eq(stack[stackIndex].umod(p))).to.equal(true);
            expect(p.sub(expected.y).eq(stack[stackIndex + 1].umod(p))).to.equal(true);
            if (i < reference.length - 2) {
                const u = dz[i];
                const zz = u.mul(u).umod(p);
                const zzz = zz.mul(u).umod(p);
                expect(stack[stackIndex + 2].eq(p)).to.equal(true);
                expect(stack[stackIndex + 3].umod(p).eq(zzz)).to.equal(true);
                expect(stack[stackIndex + 4].eq(p)).to.equal(true);
                expect(stack[stackIndex + 5].eq(p)).to.equal(true);
                expect(stack[stackIndex + 6].umod(p).eq(zz)).to.equal(true);
                expect(stack[stackIndex + 7].eq(p)).to.equal(true);
            }
        }
        const { x: x15, y: y15 } = reference[reference.length - 1];
        const z15 = tableZ;
        const u = dz[dz.length - 1];
        const zz = u.mul(u).umod(p);
        const zzz = zz.mul(u).umod(p);
        expect(stack[stack.length - 8].eq(p)).to.equal(true);
        expect(stack[stack.length - 7].umod(p).eq(zzz)).to.equal(true);
        expect(stack[stack.length - 6].eq(p)).to.equal(true);
        expect(stack[stack.length - 5].umod(p).eq(zz)).to.equal(true);
        expect(stack[stack.length - 4].umod(p).eq(x15)).to.equal(true);
        expect(stack[stack.length - 3].umod(p).eq(p.sub(y15))).to.equal(true);
        expect(stack[stack.length - 2].eq(p)).to.equal(true);
        expect(stack[stack.length - 1].umod(p).eq(z15)).to.equal(true);
        expect(stack.length === 59);
    });

    it('macro PRECOMPUTE_TABLE_ONE correctly calculates precomputed table for one point', async () => {
        const point = bn128Reference.randomPoint();
        point.z = new BN(1);
        const { tables, globalZ } = bn128Reference.generateTable([point]);
        const referenceTables = bn128Reference.rescaleMultiTable(tables, globalZ);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_ONE', [], [], [
            { index: 0, value: point.x },
            { index: 32, value: point.y },
        ]);

        const result = sliceMemory(memory, 72);
        const baseMem = result.slice(0, 8);
        const baseTable = result.slice(8, 40);
        const endoTable = result.slice(40, 72);
        expect(baseTable.length).to.equal(32);
        expect(endoTable.length).to.equal(32);
        expect(baseMem[3].umod(p).eq(globalZ.fromRed())).to.equal(true);

        const zInv = globalZ.redInvm();
        const zInv2 = zInv.redSqr();
        const xTest = p.sub(baseTable[0].umod(p)).toRed(pRed);
        const xRecovered = xTest.redMul(zInv2).fromRed();
        expect(xRecovered.eq(point.x)).to.equal(true);
        expect(stack.length).to.equal(2);
        for (let i = 0; i < baseTable.length; i += 32) {
            const expected = referenceTables[Math.floor(i / 32)];
            const comparisonTable = getComparisonTable(point.x.toRed(pRed), point.y.toRed(pRed), new BN(1).toRed(pRed));

            for (let j = 0; j < 16; j += 2) {
                const resultPoint = bn128Reference.toAffine({
                    x: p.sub(baseTable[i + j].umod(p)),
                    y: (baseTable[i + j + 1].umod(p)),
                    z: baseMem[3].umod(p),
                });
                expect(comparisonTable[j / 2].x.fromRed().eq(resultPoint.x.fromRed())).to.equal(true);
                expect(comparisonTable[j / 2].y.fromRed().eq(resultPoint.y.fromRed())).to.equal(true);
                expect(baseTable[i + j].umod(p).eq(p.sub(expected[j / 2].x))).to.equal(true);
                expect(baseTable[i + j + 1].umod(p).eq(expected[j / 2].y)).to.equal(true);
                expect(baseTable[i + 32 - j - 2].umod(p).eq(p.sub(expected[j / 2].x))).to.equal(true);
                expect(baseTable[i + 32 - j - 1].umod(p).eq(p.sub(expected[j / 2].y))).to.equal(true);
                expect(endoTable[i + j].umod(p).eq(beta.mul(p.sub(expected[j / 2].x)).umod(p))).to.equal(true);
                expect(endoTable[i + j + 1].umod(p).eq(p.sub(expected[j / 2].y))).to.equal(true);
                expect(endoTable[i + 32 - j - 2].umod(p).eq(beta.mul(p.sub(expected[j / 2].x)).umod(p))).to.equal(true);
                expect(endoTable[i + 32 - j - 1].umod(p).eq(expected[j / 2].y)).to.equal(true);
            }
        }
    });

    it('macro PRECOMPUTE_TABLE_TWO correctly calculates precomputed table for two points', async () => {
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ].map(point => ({ x: point.x, y: point.y, z: new BN(1) }));

        const { tables, globalZ } = bn128Reference.generateTable(points);
        const referenceTables = bn128Reference.rescaleMultiTable(tables, globalZ);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_TWO', [], [], [
            { index: 0, value: points[0].x },
            { index: 32, value: points[0].y },
            { index: 64, value: points[1].x },
            { index: 96, value: points[1].y },
        ]);
        const result = sliceMemory(memory, 129);
        const baseMem = result.slice(0, 1);
        const baseTable = result.slice(1, 129);
        expect(baseTable.length).to.equal(128);


        expect(baseMem[0].eq(globalZ)).to.equal(true);
        expect(stack.length).to.equal(2);

        for (let i = 0; i < baseTable.length; i += 64) {
            const expected = referenceTables[1 - Math.round(i / 64)];
            const referencePoint = points[1 - Math.round(i / 64)];
            const comparisonTable = getComparisonTable(referencePoint.x, referencePoint.y, referencePoint.z);

            for (let j = 0; j < 16; j += 2) {
                const resultPoint = bn128Reference.toAffine({
                    x: p.sub(baseTable[i + j]),
                    y: (baseTable[i + j + 1]),
                    z: baseMem[0],
                });
                expect(comparisonTable[j / 2].x.fromRed().eq(resultPoint.x.fromRed())).to.equal(true);
                expect(comparisonTable[j / 2].y.fromRed().eq(resultPoint.y.fromRed())).to.equal(true);
                expect(baseTable[i + j].umod(p).eq(p.sub(expected[j / 2].x))).to.equal(true);
                expect(baseTable[i + j + 1].umod(p).eq(expected[j / 2].y)).to.equal(true);
                expect(baseTable[i + 32 - j - 2].umod(p).eq(p.sub(expected[j / 2].x))).to.equal(true);
                expect(baseTable[i + 32 - j - 1].umod(p).eq(p.sub(expected[j / 2].y))).to.equal(true);
                expect(baseTable[i + j + 32].umod(p).eq(beta.mul(p.sub(expected[j / 2].x)).umod(p))).to.equal(true);
                expect(baseTable[i + j + 33].umod(p).eq(p.sub(expected[j / 2].y))).to.equal(true);
                expect(baseTable[i + 64 - j - 2].umod(p).eq(beta.mul(p.sub(expected[j / 2].x)).umod(p))).to.equal(true);
                expect(baseTable[i + 64 - j - 1].umod(p).eq(expected[j / 2].y)).to.equal(true);
            }
        }
    });
});
