const chai = require('chai');
const BN = require('bn.js');
const EC = require('elliptic');
const path = require('path');

const Runtime = require('../huff');
const bn128Reference = require('../js_snippets/bn128_reference');


const {
    beta,
    p,
    n,
} = bn128Reference;
const { expect } = chai;
const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

const p2 = p.add(p);
const p3 = p.add(p).add(p);

// eslint-disable-next-line new-cap
const referenceCurve = new EC.curve.short({
    a: '0',
    b: '3',
    p: p.toString(16),
    n: n.toString(16),
    gRed: false,
    g: ['1', '2'],
});


function splitPoint(x, y) {
    return {
        x: p.sub(x),
        xEndo: p.sub(x).mul(beta).umod(p),
        yNeg: y,
        y: p.sub(y),
    };
}

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

/* function splitPoint(x, y) {
    return {
        x: p.sub(x),
        xEndo: p.sub(x).mul(beta).umod(p),
        yNeg: y,
        y: p.sub(y),
    };
} */

function generatePoints(num) {
    return [...new Array(num)].map(() => bn128Reference.randomPoint()).map(point => ({ x: point.x, y: point.y, z: new BN(1) }));
}

function generateCalldata(points) {
    const formattedPoints = points.reduce((calldata, { x, y }, i) => [
        ...calldata,
        { index: (i * 64), value: x },
        { index: (i * 64) + 32, value: y },
    ], []);
    const offset = formattedPoints.length * 32;
    const scalars = points.reduce((s, x, i) => [
        ...s,
        { index: offset + (i * 32), value: bn128Reference.randomScalar() },
    ], []);
    return [...formattedPoints, ...scalars];
}

function generateTables(numPoints) {
    const points = generatePoints(numPoints);
    const { tables, globalZ } = bn128Reference.generateTable([...points].reverse());
    const referenceTables = bn128Reference.PRECOMPUTE_TABLE__RESCALEMultiTable(tables, globalZ);
    return { points, globalZ, referenceTables };
}

function validateTables(points, memory, referenceTables, expectedZ, tableOffset) {
    const numPoints = points.length;
    const resultZ = sliceMemory(memory.slice(0, 0x20))[0];
    expect(resultZ.eq(expectedZ)).to.equal(true);
    const baseTable = sliceMemory(memory.slice(tableOffset));
    expect(baseTable.length / 64).to.equal(numPoints);

    for (let i = 0; i < baseTable.length; i += 64) {
        const expected = referenceTables[Math.round(i / 64)];
        const referencePoint = points[numPoints - 1 - Math.round((i) / 64)];
        const comparisonTable = getComparisonTable(referencePoint.x, referencePoint.y, referencePoint.z);
        for (let j = 0; j < 16; j += 2) {
            const resultPoint = bn128Reference.toAffine({
                x: p.sub(baseTable[i + j]),
                y: (baseTable[i + j + 1]),
                z: resultZ,
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
}

const helperMacros = `
#include "constants.huff"
#include "precompute_table.huff"

#define macro NORMALIZE_TEST = takes(4) returns(7) {
    BETA() BETA_LOCATION() mstore
    PRECOMPUTE_TABLE__NORMALIZE<P,P>()
}

#define macro PRECOMPUTE_TABLE__RESCALE_SLICE_IMPL = takes(100) returns(0) {
    BETA() BETA_LOCATION() mstore
    PRECOMPUTE_TABLE__RESCALE_SLICE<0x1020,gas,gas>()
}

#define macro PRECOMPUTE_TABLE__RESCALE_SLICE_CODESIZE = takes(0) returns(1) {
    __codesize(PRECOMPUTE_TABLE__RESCALE_SLICE<0x1020,gas,gas>)
}

#define macro PRECOMPUTE_TABLE__RESCALE_SLICE_CODESIZE_EXPECTED = takes(0) returns(1) {
    PRECOMPUTE_TABLE__RESCALE_SLICE<0x1020,gas,gas>()
}

#define macro PRECOMPUTE_TABLE__RESCALE_WRAPPER = takes(11) returns(0) {
    BETA() BETA_LOCATION() mstore
    PRECOMPUTE_TABLE__RESCALE<dup4,0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define macro PRECOMPUTE_TABLE__RESCALE_15_TRANSITION_WRAPPER = takes(5) returns(0) {
    BETA() BETA_LOCATION() mstore
    PRECOMPUTE_TABLE__RESCALE_15_TRANSITION<0x00,0x20,0x40,0x60,0x80,0xa0,0xc0,0xe0>()
}

#define macro PRECOMPUTE_TABLE__COMPUTE_WRAPPER = takes(0) returns(0) {
    3P()
    2P()
    P()
    BETA() BETA_LOCATION() mstore // p 2p 3p d
    dup3 3P_LOCATION() mstore
    dup2 2P_LOCATION() mstore
    PRECOMPUTE_TABLE__COMPUTE()
    pop pop pop
}
`;

describe('bn128 precompute table full', () => {
    let precomputeTable;
    let inputStack;
    let tableOffset;
    before(async () => {
        inputStack = [p3, p2, p];
        precomputeTable = new Runtime(helperMacros, pathToTestData);
        const { stack } = await precomputeTable('POINT_TABLE_START_LOCATION', [], [], []);
        tableOffset = stack[0].toNumber();
    });

    it('macro PRECOMPUTE_TABLE__NORMALIZE correctly normalizes a poin\'ts x/y coordinates', async () => {
        const point = bn128Reference.randomPointJacobian();
        const zd = bn128Reference.randomFieldElement();
        const zz = zd.mul(zd).umod(p);
        const zzz = zd.mul(zz).umod(p);
        const scaledX = point.x.mul(zz).umod(p);
        const scaledY = point.y.mul(zzz).umod(p);
        const { stack } = await precomputeTable(
            'NORMALIZE_TEST',
            [point.z, point.x, point.y, zd]
        );
        expect(stack.length).to.equal(7);
        expect(stack[0].eq(zzz)).to.equal(true);
        expect(stack[1].eq(p)).to.equal(true);
        expect(stack[2].eq(zz)).to.equal(true);
        expect(stack[3].eq(p)).to.equal(true);
        expect(stack[4].umod(p).eq(scaledX)).to.equal(true);
        expect(stack[5].umod(p).eq(p.sub(scaledY))).to.equal(true);
        expect(stack[6].umod(p).eq(point.z)).to.equal(true);
    });

    it('macro PRECOMPUTE_TABLE__RESCALE_SLICE has correct code size', async () => {
        const input = [...new Array(100)].map(() => new BN(1));
        const { bytecode } = await precomputeTable('PRECOMPUTE_TABLE__RESCALE_SLICE_CODESIZE_EXPECTED', input, [], [], 1);

        const { stack } = await precomputeTable('PRECOMPUTE_TABLE__RESCALE_SLICE_CODESIZE', [], [], []);
        expect(bytecode.length / 2).to.equal(stack[0].toNumber());
    });


    it('macro PRECOMPUTE_TABLE__RESCALE correctly performs point rescaling', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await precomputeTable(
            'PRECOMPUTE_TABLE__RESCALE_WRAPPER',
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

    it('macro PRECOMPUTE_TABLE__RESCALE_15_TRANSITION correctly PRECOMPUTE_TABLE__RESCALEs x,y coordinates of new table entry on stack', async () => {
        const p1 = bn128Reference.randomPoint();
        const dz = bn128Reference.randomPoint(); // mock up some random dz factors
        const dz2 = [dz.x.mul(dz.x).umod(p), dz.y.mul(dz.y).umod(p)];
        const dz3 = [dz2[0].mul(dz.x).umod(p), dz2[1].mul(dz.y).umod(p)];
        const { stack, memory } = await precomputeTable(
            'PRECOMPUTE_TABLE__RESCALE_15_TRANSITION_WRAPPER',
            [p, p1.x, p1.y, dz2[0], dz3[0]],
            [],
            [],
            1
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

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for ONE point', async () => {
        const { points, globalZ, referenceTables } = generateTables(1);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for TWO points', async () => {
        const { points, globalZ, referenceTables } = generateTables(2);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for THREE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(3);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for FOUR points', async () => {
        const { points, globalZ, referenceTables } = generateTables(4);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for FIVE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(5);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for SIX points', async () => {
        const { points, globalZ, referenceTables } = generateTables(6);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for SEVEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(7);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for EIGHT points', async () => {
        const { points, globalZ, referenceTables } = generateTables(8);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for NINE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(9);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for TEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(10);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });
    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for ELEVEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(11);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for TWELVE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(12);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for THIRTEEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(13);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for FOURTEEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(14);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });

    it('macro PRECOMPUTE_TABLE__COMPUTE correctly calculates precomputed table for FIFTEEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(15);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata, 1);
        expect(stack.length).to.equal(3);
        validateTables(points, memory, referenceTables, globalZ, tableOffset);
    });
});
