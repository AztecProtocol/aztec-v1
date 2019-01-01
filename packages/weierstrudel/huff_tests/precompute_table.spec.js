const chai = require('chai');
const BN = require('bn.js');
const EC = require('elliptic');
const path = require('path');

const Runtime = require('../huff/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');


const {
    beta,
    p,
    n,
} = bn128Reference;
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
    const referenceTables = bn128Reference.rescaleMultiTable(tables, globalZ);
    return { points, globalZ, referenceTables };
}
function validateTables(points, memory, referenceTables, globalZ) {
    const numPoints = points.length;
    const result = sliceMemory(memory);
    const baseMem = result.slice(0, 1);
    expect(baseMem[0].eq(globalZ)).to.equal(true);
    const baseTable = result.slice(129);
    expect(baseTable.length / 64).to.equal(numPoints);

    for (let i = 0; i < baseTable.length; i += 64) {
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
}

const helperMacros = `
#include "constants.huff"
#include "precompute_table.huff"
#define RESCALE_SLICE_IMPL = takes(100) returns(0) {
    RESCALE_SLICE<0x1020,gas,gas>()
}

#define RESCALE_SLICE_CODESIZE = takes(0) returns(1) {
    __codesize(RESCALE_SLICE<0x1020,gas,gas>)
}
`;

describe('bn128 precompute table full', () => {
    let precomputeTable;
    before(() => {
        precomputeTable = new Runtime(helperMacros, pathToTestData);
    });

    it('macro RESCALE_SLICE has correct code size', async () => {
        const input = [...new Array(100)].map(() => new BN(1));
        const { bytecode } = await precomputeTable('RESCALE_SLICE_IMPL', input, [], []);

        const { stack } = await precomputeTable('RESCALE_SLICE_CODESIZE', [], [], []);
        expect(bytecode.length / 2).to.equal(stack[0].toNumber());
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for ONE point', async () => {
        const { points, globalZ, referenceTables } = generateTables(1);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for TWO points', async () => {
        const { points, globalZ, referenceTables } = generateTables(2);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for THREE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(3);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for FOUR points', async () => {
        const { points, globalZ, referenceTables } = generateTables(4);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for FIVE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(5);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for SIX points', async () => {
        const { points, globalZ, referenceTables } = generateTables(6);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for SEVEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(7);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for EIGHT points', async () => {
        const { points, globalZ, referenceTables } = generateTables(8);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for NINE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(9);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for TEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(10);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });
    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for ELEVEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(11);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for TWELVE points', async () => {
        const { points, globalZ, referenceTables } = generateTables(12);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for THIRTEEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(13);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for FOURTEEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(14);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });

    it('macro PRECOMPUTE_TABLE_FULL_OFFSET correctly calculates precomputed table for FIFTEEN points', async () => {
        const { points, globalZ, referenceTables } = generateTables(15);
        const calldata = generateCalldata(points);

        const { stack, memory } = await precomputeTable('PRECOMPUTE_TABLE_FULL_OFFSET', [], [], calldata);
        expect(stack.length).to.equal(2);
        validateTables(points, memory, referenceTables, globalZ);
    });
});
