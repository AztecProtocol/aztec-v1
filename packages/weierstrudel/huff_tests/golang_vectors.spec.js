/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const path = require('path');
const BN = require('bn.js');

const { Runtime } = require('../../huff');
const bn128Reference = require('../js_snippets/bn128_reference');
const toBytes32 = require('../js_snippets/toBytes32');
const inputVectors = require('./test_vectors');

const {
    sliceMemory,
    referenceCurve,
} = require('../js_snippets/utils');

const { expect } = chai;
const { p, beta } = bn128Reference;

const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');


const p2 = p.add(p);
const p3 = p.add(p).add(p);

function getComparisonTable(x, y, z) {
    const normalized = bn128Reference.toAffine({ x, y, z });
    const point = referenceCurve.point(normalized.x.fromRed(), normalized.y.fromRed());
    const table = [point];
    for (let i = 1; i < 8; i += 1) {
        table[i] = point.mul(new BN((i * 2) + 1));
    }
    return table;
}

function generateTables(points) {
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

function toString(returnValue) {
    const returnWords = sliceMemory(returnValue);
    const x = new BN(returnWords[0], 16);
    const y = new BN(returnWords[1], 16);
    const z = new BN(returnWords[2], 16);
    const res = bn128Reference.toAffine({ x, y, z });
    return `${toBytes32(res.x.fromRed().toString(16))}${toBytes32(res.y.fromRed().toString(16))}`;
}

describe('golang test vectors', function describe() {
    this.timeout(10000);
    let main;
    before(() => {
        main = new Runtime('main_loop.huff', pathToTestData);
    });

    it('precompute table works', async () => {
        const precomputeTable = new Runtime(helperMacros, pathToTestData);
        const { stack: initStack } = await precomputeTable('POINT_TABLE_START_LOCATION', [], [], []);
        const tableOffset = initStack[0].toNumber();
        const inputStack = [p3, p2, p];

        const testPromises = inputVectors.map(({ calldata }) => {
            return precomputeTable('PRECOMPUTE_TABLE__COMPUTE_WRAPPER', inputStack, [], calldata);
        });
        const comparisonData = inputVectors.map(({ point }) => {
            return generateTables([{ x: point.x, y: point.y, z: new BN(1) }]);
        });
        const results = await Promise.all(testPromises);
        results.forEach(({ stack, memory }, i) => {
            expect(stack.length).to.equal(3);
            const { points, referenceTables, globalZ } = comparisonData[i];
            validateTables(points, memory, referenceTables, globalZ, tableOffset);
        });
    });

    it('all test vectors pass', async () => {
        const testPromises = inputVectors.map(({ calldata }) => {
            return main('WEIERSTRUDEL__MAIN', [], [], calldata);
        });
        const results = await Promise.all(testPromises);
        results.forEach(({ stack, returnValue }, i) => {
            const result = toString(returnValue);
            expect(stack.length).to.equal(0);
            expect(result).to.equal(inputVectors[i].expected);
        });
    }).timeout(10000);
});
