const chai = require('chai');
const BN = require('bn.js');
const path = require('path');

const endomorphism = require('../js_snippets/endomorphism');
const referenceWnaf = require('../js_snippets/wnaf');
const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;

const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

const testHelper = `
#include "wnaf.huff"
#define WNAF_IMPL = takes(2) returns(1) {
    SET_WNAF_TABLE()
    WNAF()
}

#define ENDO_WNAF_FIXED_IMPL = takes(8) returns(1) {
    SET_WNAF_TABLE()
    ENDO_WNAF_FIXED()
}

#define WNAF_SLICE_A_IMPL = takes(8) returns(1) {
    SET_WNAF_TABLE()
    WNAF_SLICE_A()
}

#define WNAF_SLICE_B_IMPL = takes(8) returns(1) {
    SET_WNAF_TABLE()
    WNAF_SLICE_B()
}
`;

describe.only('sparse wnaf', function describe() {
    this.timeout(5000);
    let wnaf;
    let thirtyTwo;
    let wnafStartingStack;
    before(() => {
        wnaf = new Runtime(testHelper, pathToTestData);
        thirtyTwo = new BN(32);

        wnafStartingStack = [
            new BN('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0', 16),
            new BN(16),
            new BN('1fe0', 16),
            new BN(269),
            new BN(0),
            new BN(0),
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
        expect(stack.length).to.equal(8);
        expect(stack[6].toString(10)).to.equal('832');
        expect(stack[7].toString(2)).to.equal('111011110100000');
    });

    it('macro WNAF_SLICE_B correctly calclates a wnaf slice', async () => {
        const w = new BN('1110111100101110', 2);
        const baseOffset = 800;
        const { memory, stack } = await wnaf('WNAF_SLICE_B_IMPL', [...wnafStartingStack, new BN(baseOffset), w], [], []);
        expect(new BN(memory[832], 16).umod(thirtyTwo).toString(10)).to.equal('23');
        expect(stack.length).to.equal(8);
        expect(stack[7].toString(10)).to.equal('832');
        expect(stack[6].toString(2)).to.equal('111011110100000');
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

    it('macro WNAF_INIT correctly sets up wnaf stack state', async () => {
        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ];

        const calldata = [
            { index: 0, value: points[0].x },
            { index: 32 * 1, value: points[0].y },
            { index: 32 * 2, value: points[1].x },
            { index: 32 * 3, value: points[1].y },
            { index: 32 * 4, value: points[2].x },
            { index: 32 * 5, value: points[2].y },
            { index: 32 * 6, value: points[3].x },
            { index: 32 * 7, value: points[3].y },
            { index: 32 * 8, value: scalars[0] },
            { index: 32 * 9, value: scalars[1] },
            { index: 32 * 10, value: scalars[2] },
            { index: 32 * 11, value: scalars[3] },
        ];

        const { stack } = await wnaf('WNAF_INIT', [], [], calldata);

        expect(stack.length).to.equal(7);
        expect(stack[0].toString(16)).to.equal('1000000000000000000000000000000000');
        expect(stack[1].toString(16)).to.equal('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0');
        expect(stack[2].toString(10)).to.equal('16');
        expect(stack[3].toString(16)).to.equal('1fe0');
        expect(stack[4].toString(10)).to.equal('269');
        expect(stack[5].toString(16)).to.equal('1046');
        expect(stack[6].toString(16)).to.equal('100');
    });

    it('macro WNAF_INIT correctly sets up wnaf stack state for p = 2', async () => {
        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ];

        const calldata = [
            { index: 0, value: points[0].x },
            { index: 32 * 1, value: points[0].y },
            { index: 32 * 2, value: points[1].x },
            { index: 32 * 3, value: points[1].y },
            { index: 32 * 4, value: scalars[0] },
            { index: 32 * 5, value: scalars[1] },
        ];

        const { stack } = await wnaf('WNAF_INIT', [], [], calldata);

        expect(stack.length).to.equal(7);
        expect(stack[0].toString(16)).to.equal('1000000000000000000000000000000000');
        expect(stack[1].toString(16)).to.equal('ffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0');
        expect(stack[2].toString(10)).to.equal('16');
        expect(stack[3].toString(16)).to.equal('1fe0');
        expect(stack[4].toString(10)).to.equal('269');
        expect(stack[5].toString(16)).to.equal('1042');
        expect(stack[6].toString(16)).to.equal('80');
    });

    it('macro COMPUTE_WNAFS will correctly calculate w=5 endo split wnafs for multiple scalars', async () => {
        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ];

        const calldata = [
            { index: 0, value: points[0].x },
            { index: 32 * 1, value: points[0].y },
            { index: 32 * 2, value: points[1].x },
            { index: 32 * 3, value: points[1].y },
            { index: 32 * 4, value: points[2].x },
            { index: 32 * 5, value: points[2].y },
            { index: 32 * 6, value: points[3].x },
            { index: 32 * 7, value: points[3].y },
            { index: 32 * 8, value: scalars[0] },
            { index: 32 * 9, value: scalars[1] },
            { index: 32 * 10, value: scalars[2] },
            { index: 32 * 11, value: scalars[3] },
        ];
        const { memory } = await wnaf('COMPUTE_WNAFS', [], [], calldata);


        const endoScalars = scalars.reduce((acc, s) => {
            const { k1, k2 } = endomorphism.endoSplit(s);
            return [...acc, k1, k2];
        }, []);

        const referenceWnafs = endoScalars.map(s => referenceWnaf.wnaf(s));

        const startingOffset = new BN('1046', 16);
        let maxEntry = 0;
        for (let j = 0; j < referenceWnafs.length; j += 1) {
            const reference = referenceWnafs[j];
            // eslint-disable-next-line no-bitwise
            const isOdd = j & 1;
            const baseOffset = startingOffset - (j) + (isOdd * 2);
            for (let i = 0; i < reference.length; i += 1) {
                const memoryOffset = baseOffset + (i * 32);
                if (reference[i] && reference[i].gt(new BN(0))) {
                    maxEntry = Math.max(maxEntry, i);
                    expect(reference[i].toString(16)).to.equal(new BN(memory[memoryOffset], 16).umod(thirtyTwo).toString(16));
                }
            }
        }

        const size = new BN(memory.slice(4128, 4128 + 32), 16);
        expect(size.toString(16)).to.equal(new BN(4160 + (maxEntry * 32)).toString(16));
    });


    it('macro COMPUTE_WNAFS will correctly calculate w=5 endo split wnafs for multiple scalars', async () => {
        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ];

        const calldata = [
            { index: 0, value: points[0].x },
            { index: 32 * 1, value: points[0].y },
            { index: 32 * 2, value: points[1].x },
            { index: 32 * 3, value: points[1].y },
            { index: 32 * 4, value: scalars[0] },
            { index: 32 * 5, value: scalars[1] },
        ];
        const { memory } = await wnaf('COMPUTE_WNAFS', [], [], calldata);


        const endoScalars = scalars.reduce((acc, s) => {
            const { k1, k2 } = endomorphism.endoSplit(s);
            return [...acc, k1, k2];
        }, []);

        const referenceWnafs = endoScalars.map(s => referenceWnaf.wnaf(s));

        const startingOffset = new BN('1042', 16);
        let maxEntry = 0;
        for (let j = 0; j < referenceWnafs.length; j += 1) {
            const reference = referenceWnafs[j];
            // eslint-disable-next-line no-bitwise
            const isOdd = j & 1;
            const baseOffset = startingOffset - (j) + (isOdd * 2);
            for (let i = 0; i < reference.length; i += 1) {
                const memoryOffset = baseOffset + (i * 32);
                if (reference[i] && reference[i].gt(new BN(0))) {
                    maxEntry = Math.max(maxEntry, i);
                    expect(reference[i].toString(16)).to.equal(new BN(memory[memoryOffset], 16).umod(thirtyTwo).toString(16));
                }
            }
        }

        const size = new BN(memory.slice(4128, 4128 + 32), 16);
        expect(size.toString(16)).to.equal(new BN(4160 + (maxEntry * 32)).toString(16));
    });

    it('comparison', async () => {
        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];
        const points = [
            bn128Reference.randomPoint(),
            bn128Reference.randomPoint(),
        ];

        const calldata = [
            { index: 0, value: points[0].x },
            { index: 32 * 1, value: points[0].y },
            { index: 32 * 2, value: points[1].x },
            { index: 32 * 3, value: points[1].y },
            { index: 32 * 4, value: scalars[0] },
            { index: 32 * 5, value: scalars[1] },
        ];
        const { memory } = await wnaf('COMPUTE_WNAFS', [], [], calldata);
        const { memory: expectedMemory } = await wnaf('COMPUTE_WNAFS_COMPARISON', [], [], calldata);

        const end = memory.slice(4128, 4128 + 32);
        const second = expectedMemory.slice(4128, 4128 + 32);
        expect(new BN(end, 16).toString(16)).to.equal(new BN(second, 16).toString(16));

        const mask = new BN('1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f1f', 16);
        for (let i = 4160; i < new BN(end, 16).toNumber(); i += 32) {
            const a = new BN(memory.slice(i, i + 32), 16).uand(mask);
            const b = new BN(Buffer.from(expectedMemory.slice(i, i + 32), 16)).uand(mask);
            expect(a.toString(16)).to.equal(b.toString(16));
        }
    });
});
