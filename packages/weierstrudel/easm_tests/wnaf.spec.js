const chai = require('chai');
const BN = require('bn.js');

const referenceWnaf = require('../js_snippets/wnaf_reference_implementation');
const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;

describe('sparse wnaf', () => {
    let wnaf;
    before(() => {
        wnaf = new Runtime('./easm_modules/wnaf.easm');
    });
    it('macro WNAF correctly calculates a w=5 windowed non adjacent form of a 254 bit number', async () => {
        const testVar = bn128Reference.randomPoint().x;
        const reference = referenceWnaf(testVar);
        const { memory } = await wnaf('WNAF', [new BN(0), testVar], [], []);

        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = (i * 32);
            if (reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16))).to.equal(true);
            }
        }
    });

    it('macro WNAF correctly calculates a w=5 NAF of a 254 bit number with added memory offset', async () => {
        const testVar = bn128Reference.randomPoint().x;
        const reference = referenceWnaf(testVar);
        const baseOffset = 1025;
        const { memory } = await wnaf('WNAF', [new BN(baseOffset), testVar], [], []);

        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = baseOffset + (i * 32);
            if (reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16))).to.equal(true);
            }
        }
    });
});
