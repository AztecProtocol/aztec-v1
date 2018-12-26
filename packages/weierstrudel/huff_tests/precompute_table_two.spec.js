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


function sliceMemory(memArray) {
    const numWords = Math.ceil(memArray.length / 32);
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

describe.only('bn128 precompute table two', () => {
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
        const result = sliceMemory(memory);
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
        const result = sliceMemory(memory);
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
        const result = sliceMemory(memory);
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
        const result = sliceMemory(memory);
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

    it('macro PRECOMPUTE_TABLE_ONE correctly calculates precomputed table for one point', async () => {
        const point = bn128Reference.randomPoint();
        point.z = new BN(1);
        const { tables, globalZ } = bn128Reference.generateTable([point]);
        const referenceTables = bn128Reference.rescaleMultiTable(tables, globalZ);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_ONE', [], [], [
            { index: 0, value: point.x },
            { index: 32, value: point.y },
        ]);

        const result = sliceMemory(memory);
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
        const result = sliceMemory(memory);
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

    it('macro PRECOMPUTE_TABLE_THREE correctly calculates precomputed table for three points', async () => {
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ].map(point => ({ x: point.x, y: point.y, z: new BN(1) }));

        const { tables, globalZ } = bn128Reference.generateTable(points);
        const referenceTables = bn128Reference.rescaleMultiTable(tables, globalZ);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_THREE', [], [], [
            { index: 0, value: points[0].x },
            { index: 32, value: points[0].y },
            { index: 64, value: points[1].x },
            { index: 96, value: points[1].y },
            { index: 128, value: points[2].x },
            { index: 160, value: points[2].y },
        ]);
        const result = sliceMemory(memory);
        const baseMem = result.slice(0, 1);
        expect(baseMem[0].eq(globalZ)).to.equal(true);
        const baseTable = result.slice(1, 129);
        expect(baseTable.length).to.equal(128);


        expect(stack.length).to.equal(2);
        const numPoints = baseTable.length / 64;
        expect(numPoints).to.equal(2);
        for (let i = 0; i < baseTable.length; i += 64) {
            const expected = referenceTables[numPoints - Math.round(i / 64)];
            const referencePoint = points[numPoints - Math.round(i / 64)];
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

    it('macro PRECOMPUTE_TABLE_FULL correctly calculates precomputed table for three points', async () => {
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ].map(point => ({ x: point.x, y: point.y, z: new BN(1) }));

        const { tables, globalZ } = bn128Reference.generateTable([points[2], points[1], points[0]]);
        const referenceTables = bn128Reference.rescaleMultiTable(tables, globalZ);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL', [], [], [
            { index: 0, value: points[0].x },
            { index: 32, value: points[0].y },
            { index: 64, value: points[1].x },
            { index: 96, value: points[1].y },
            { index: 128, value: points[2].x },
            { index: 160, value: points[2].y },
            { index: 192, value: bn128Reference.randomScalar() },
            { index: 224, value: bn128Reference.randomScalar() },
            { index: 256, value: bn128Reference.randomScalar() },
        ]);
        const result = sliceMemory(memory);
        const baseMem = result.slice(0, 1);
        expect(baseMem[0].eq(globalZ)).to.equal(true);
        const baseTable = result.slice(1);
        expect(baseTable.length).to.equal(192);
        // console.log(stack);
        expect(stack.length).to.equal(2);
        const numPoints = baseTable.length / 64;
        expect(numPoints).to.equal(3);
        // console.log(JSON.stringify(result));
        for (let i = 0; i < baseTable.length; i += 64) {
            /* let expected;
            let referencePoint;
            if (i === 0) {
                expected = referenceTables[referenceTables.length - 1];
                // eslint-disable-next-line prefer-destructuring
                referencePoint = points[0];
            } else {
                expected = referenceTables[Math.round(i / 64) - 1];
                referencePoint = points[numPoints - 1 - Math.round((i - 64) / 64)];
            } */
            const expected = referenceTables[Math.round(i / 64)];
            const referencePoint = points[numPoints - 1 - Math.round((i) / 64)];

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

    it.only('PRECOMPUTE_TABLE_TWO and PRECOMPUTE_TABLE_FULL create identical memory maps for p = 2', async () => {
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ].map(point => ({ x: point.x, y: point.y, z: new BN(1) }));


        const { memory } = await precomputeTable('PRECOMPUTE_TABLE_TWO', [], [], [
            { index: 0, value: points[0].x },
            { index: 32, value: points[0].y },
            { index: 64, value: points[1].x },
            { index: 96, value: points[1].y },
        ]);
        const [resultZ, ...result] = sliceMemory(memory);

        const { memory: memoryB } = await precomputeTable('PRECOMPUTE_TABLE_FULL', [], [], [
            { index: 0, value: points[0].x },
            { index: 32, value: points[0].y },
            { index: 64, value: points[1].x },
            { index: 96, value: points[1].y },
            { index: 128, value: bn128Reference.randomScalar() },
            { index: 160, value: bn128Reference.randomScalar() },
        ]);
        const [expectedZ, ...expected] = sliceMemory(memoryB);

        expect(result.length).to.equal(expected.length);
        for (let i = 0; i < result.length; i += 2) {
            const first = bn128Reference.toAffine({
                x: p.sub(result[i]),
                y: (result[i + 1]),
                z: resultZ,
            });
            const second = bn128Reference.toAffine({
                x: p.sub(expected[i]),
                y: (expected[i + 1]),
                z: expectedZ,
            });
            expect(first.x.eq(second.x)).to.equal(true);
            expect(first.y.eq(second.y)).to.equal(true);
        }
    });
});
