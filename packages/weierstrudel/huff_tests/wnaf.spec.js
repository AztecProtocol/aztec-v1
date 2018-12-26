const chai = require('chai');
const BN = require('bn.js');

const referenceWnaf = require('../js_snippets/wnaf');
const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;

const testHelper = `
#include "wnaf.huff"
#define WNAF_IMPL = takes(2) returns(1) {
    SET_WNAF_TABLE()
    WNAF()
}
`;

describe('sparse wnaf', () => {
    let wnaf;
    let thirtyTwo;
    before(() => {
        wnaf = new Runtime(testHelper);
        thirtyTwo = new BN(32);
    });
    it('macro WNAF correctly calculates a w=5 windowed non adjacent form of a 254 bit number', async () => {
        const testVar = bn128Reference.randomPoint().x;
        const reference = referenceWnaf(testVar);
        const { memory } = await wnaf('WNAF_IMPL', [new BN(0), testVar], [], []);

        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = (i * 32);
            if (reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16).umod(thirtyTwo))).to.equal(true);
            }
        }
    });

    it('macro WNAF correctly calculates a w=5 NAF of a 254 bit number with added memory offset', async () => {
        const testVar = bn128Reference.randomPoint().x;
        const reference = referenceWnaf(testVar);
        const baseOffset = 1025;
        const { memory } = await wnaf('WNAF_IMPL', [new BN(baseOffset), testVar], [], []);
        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = baseOffset + (i * 32);
            if (reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16).umod(thirtyTwo))).to.equal(true);
            }
        }
    });
});
