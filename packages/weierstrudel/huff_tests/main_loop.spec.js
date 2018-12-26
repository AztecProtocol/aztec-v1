/* eslint-disable prefer-arrow-callback */
const chai = require('chai');
const BN = require('bn.js');
const EC = require('elliptic');

const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;
const { p, pRed, n } = bn128Reference;

// NOTE: potential areas to improve
// 1: main loop is garbage, too many special case tests
// 2: P macro used too often, huge bytecode bload
// 3: not sure we need to use 'mod' in RESCALE_15, just subtract from 4p when we need to negate?

function sliceMemory(memArray) {
    const numWords = Math.ceil(memArray.length / 32);
    const result = [];
    for (let i = 0; i < numWords * 32; i += 32) {
        result.push(new BN(memArray.slice(i, i + 32), 16));
    }
    return result;
}

// eslint-disable-next-line new-cap
const referenceCurve = new EC.curve.short({
    a: '0',
    b: '3',
    p: p.toString(16),
    n: n.toString(16),
    gRed: false,
    g: ['1', '2'],
});


describe('bn128 main loop', function describe() {
    this.timeout(10000);
    let main;
    before(() => {
        main = new Runtime('../huff_modules/main_loop.huff');
    });
    it('macro GET_P2_LOCATION correctly calculates point location from a wnaf', async () => {
        const wnaf = new BN('1f00000000000000050000000001000000000b00000000000000000000000000', 16);
        const initialMemory = [{
            index: 0,
            value: wnaf,
        }];
        const { stack } = await main('GET_P2_LOCATION', [], initialMemory);
        expect(stack.length).to.equal(2);
        const [oX, oY] = stack;
        const expectedOffset = 18;
        const expectedBaseOffset = 1024 * expectedOffset;
        const expectedWnaf = 11;
        const expectedFinalOffset = expectedBaseOffset + (expectedWnaf * 32);
        expect(oX.eq(new BN(expectedFinalOffset))).to.equal(true);
        expect(oY.eq(new BN(expectedFinalOffset + 32))).to.equal(true);
    });

    it('macro MAIN_TWO calculates scalar multiplication of two points', async () => {
        const P1 = bn128Reference.randomPoint();
        const P2 = bn128Reference.randomPoint();

        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];

        const calldata = [
            { index: 0, value: P1.x },
            { index: 32, value: P1.y },
            { index: 64, value: P2.x },
            { index: 96, value: P2.y },
            { index: 128, value: scalars[0] },
            { index: 160, value: scalars[1] },
        ];

        const { stack, returnValue } = await main('MAIN_TWO', [], [], calldata);
        const expected = referenceCurve.point(P1.x, P1.y).mul(scalars[0]).add(referenceCurve.point(P2.x, P2.y).mul(scalars[1]));

        const returnWords = sliceMemory(returnValue);

        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });

        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });

    it('macro MAIN_TWO_ENDO calculates scalar multiplication of two points', async () => {
        const P1 = bn128Reference.randomPoint();
        const P2 = bn128Reference.randomPoint();

        const scalars = [
            bn128Reference.randomScalar(),
            bn128Reference.randomScalar(),
        ];

        const calldata = [
            { index: 0, value: P1.x },
            { index: 32, value: P1.y },
            { index: 64, value: P2.x },
            { index: 96, value: P2.y },
            { index: 128, value: scalars[0] },
            { index: 160, value: scalars[1] },
        ];

        const { stack, returnValue } = await main('MAIN_TWO_ENDO', [], [], calldata);
        const expected = referenceCurve.point(P1.x, P1.y).mul(scalars[0]).add(referenceCurve.point(P2.x, P2.y).mul(scalars[1]));
        const returnWords = sliceMemory(returnValue);
        const x = returnWords[0].toRed(pRed);
        const y = returnWords[1].toRed(pRed);
        const z = returnWords[2].toRed(pRed);
        const result = bn128Reference.toAffine({ x, y, z });

        expect(returnWords.length).to.equal(3);
        expect(stack.length).to.equal(0);
        expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
        expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
    });
});
