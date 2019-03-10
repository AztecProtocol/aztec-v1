/* eslint-disable no-bitwise */
const chai = require('chai');
const BN = require('bn.js');
const path = require('path');

const endomorphism = require('../js_snippets/endomorphism');
const referenceWnaf = require('../js_snippets/wnaf');
const { Runtime } = require('../../huff');
const bn128Reference = require('../js_snippets/bn128_reference');
const { generatePoints, generateScalars, generateCalldata } = require('../js_snippets/utils');

const { expect } = chai;

const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

const testHelper = `
#include "constants.huff"
#include "wnaf.huff"

#define macro WNAF_GREEDY__COMPUTE_IMPL = takes(0) returns(1) {
    WNAF_GREEDY__SIZE_OF_ENTRY()
    WNAF_GREEDY__COMPUTE()
}

`;

describe('wnaf', function describe() {
    this.timeout(5000);
    let wnaf;

    before(async () => {
        wnaf = new Runtime(testHelper, pathToTestData);
    });

    it('macro WNAF_GREEDY__COMPUTE will correctly calculate w=5 endo split wnafs for multiple scalars', async () => {
        const points = generatePoints(4);
        const scalars = generateScalars(4);
        const { calldata } = generateCalldata(points, scalars);

        let { stack } = await wnaf('WNAF_START_LOCATION', [], [], calldata, 1);
        const wnafStartLocation = stack[0].toNumber();

        ({ stack } = await wnaf('POINT_TABLE_START_LOCATION', [], [], calldata, 1));
        const pointTableStartLocation = stack[0].toNumber();

        ({ stack } = await wnaf('WNAF_GREEDY__SIZE_OF_ENTRY', [], [], calldata, 1));
        const wnafSizeOfEntry = stack[0].toNumber();

        const { memory } = await wnaf('WNAF_GREEDY__COMPUTE_IMPL', [], [], calldata, 1);
        const endoScalars = scalars.reduce((acc, s) => {
            const { k1, k2 } = endomorphism.endoSplit(s);
            return [...acc, k2, k1];
        }, []);
        const referenceWnafs = endoScalars.map(s => referenceWnaf.wnaf(s));
        for (let i = 0; i < 128; i += 1) {
            const baseOffset = wnafStartLocation + (i * wnafSizeOfEntry);
            const count = memory[baseOffset + 0x1f] || 0;
            const referenceCount = referenceWnafs.filter(w => (w[i] && w[i].gt(new BN(0)))).length;
            expect(count).to.equal(referenceCount * 2);

            for (let j = 0; j < referenceCount; j += 2) {
                const offset = baseOffset - wnafSizeOfEntry - 2 - j;
                const wnafEntry = ((memory[offset] << 8) + memory[offset + 1]);
                const t1 = wnafEntry - pointTableStartLocation;
                const pointIndex = Math.floor(t1 / 0x400);
                const wnafValue = ((t1 >> 5) & 0x1f) + 1;
                const referenceIndex = referenceWnafs.length - 1 - pointIndex;
                const reference = referenceWnafs[referenceIndex] ? referenceWnafs[referenceIndex][i].toNumber() : 0;
                expect(wnafValue).to.equal(reference);
                expect(wnafValue > 0).to.equal(true);
            }
        }
    });
});
