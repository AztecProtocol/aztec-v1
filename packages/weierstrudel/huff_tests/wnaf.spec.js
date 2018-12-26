const chai = require('chai');
const BN = require('bn.js');

const endomorphism = require('../js_snippets/endomorphism');
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

#define ENDO_WNAF_FIXED_IMPL = takes(6) returns(1) {
    SET_WNAF_TABLE()
    ENDO_WNAF_FIXED()
}

#define WNAF_SLICE_A_IMPL = takes(6) returns(1) {
    SET_WNAF_TABLE()
    WNAF_SLICE_A()
}

#define WNAF_SLICE_B_IMPL = takes(6) returns(1) {
    SET_WNAF_TABLE()
    WNAF_SLICE_B()
}
`;

describe.only('sparse wnaf', function describe() {
    this.timeout(30000);
    let wnaf;
    let thirtyTwo;
    let wnafStartingStack;
    before(() => {
        wnaf = new Runtime(testHelper);
        thirtyTwo = new BN(32);

        wnafStartingStack = [
            new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0', 16),
            new BN(16),
            new BN('1fe0', 16),
            new BN(269),
        ];
    });
    it('macro WNAF correctly calculates a w=5 windowed non adjacent form of a 254 bit number', async () => {
        const testVar = bn128Reference.randomPoint().x;
        const reference = referenceWnaf.wnaf(testVar);
        const { memory } = await wnaf('WNAF_IMPL', [new BN(0), testVar], [], []);

        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = (i * 32);
            if (reference[i] && reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16).umod(thirtyTwo))).to.equal(true);
            }
        }
    });

    it('macro WNAF correctly calculates a w=5 NAF of a 254 bit number with added memory offset', async () => {
        const testVar = bn128Reference.randomPoint().x;
        const reference = referenceWnaf.wnaf(testVar);
        const baseOffset = 1025;
        const { memory } = await wnaf('WNAF_IMPL', [new BN(baseOffset), testVar], [], []);
        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = baseOffset + (i * 32);
            if (reference[i] && reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16).umod(thirtyTwo))).to.equal(true);
            }
        }
    });


    it('macro WNAF correctly calculates a w=5 NAF of a 127 bit number with added memory offset', async () => {
        const scalar = bn128Reference.randomScalar();
        const { k1: endoScalar } = endomorphism.endoSplit(scalar);
        const reference = referenceWnaf.wnaf(endoScalar);
        const baseOffset = 1025;
        const { memory } = await wnaf('WNAF_IMPL', [new BN(baseOffset), endoScalar], [], []);
        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = baseOffset + (i * 32);
            if (reference[i] && reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16).umod(thirtyTwo))).to.equal(true);
            }
        }
    });

    it('macro WNAF_SLICE_A correctly calclates a wnaf slice', async () => {
        const w = new BN('1110111100101110', 2);
        const baseOffset = 800;
        const { memory, stack } = await wnaf('WNAF_SLICE_A_IMPL', [...wnafStartingStack, w, new BN(baseOffset)], [], []);
        expect(new BN(memory[832], 16).umod(thirtyTwo).toString(10)).to.equal('23');
        expect(stack.length).to.equal(6);
        expect(stack[4].toString(10)).to.equal('832');
        expect(stack[5].toString(2)).to.equal('111011110100000');
    });

    it('macro WNAF_SLICE_B correctly calclates a wnaf slice', async () => {
        const w = new BN('1110111100101110', 2);
        const baseOffset = 800;
        const { memory, stack } = await wnaf('WNAF_SLICE_B_IMPL', [...wnafStartingStack, new BN(baseOffset), w], [], []);
        expect(new BN(memory[832], 16).umod(thirtyTwo).toString(10)).to.equal('23');
        expect(stack.length).to.equal(6);
        expect(stack[5].toString(10)).to.equal('832');
        expect(stack[4].toString(2)).to.equal('111011110100000');
    });

    it('macro ENDO_WNAF_FIXED correctly calculates a w=5 NAF of a 127-bit number, with added memory offset', async () => {
        const scalar = bn128Reference.randomScalar();
        let { k1: endoScalar } = endomorphism.endoSplit(scalar);
        const reference = referenceWnaf.wnaf(endoScalar);
        endoScalar = endoScalar.or(new BN('1000000000000000000000000000000000', 16));
        const baseOffset = 1025;
        const { memory } = await wnaf('ENDO_WNAF_FIXED_IMPL', [...wnafStartingStack, endoScalar, new BN(baseOffset)], [], []);
        for (let i = 0; i < reference.length; i += 1) {
            const memoryOffset = baseOffset + (i * 32);
            if (reference[i] && reference[i].gt(new BN(0))) {
                expect(reference[i].eq(new BN(memory[memoryOffset], 16).umod(thirtyTwo))).to.equal(true);
            }
        }
    });
});
