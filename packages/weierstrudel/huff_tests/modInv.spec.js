const chai = require('chai');
const BN = require('bn.js');
const crypto = require('crypto');
const path = require('path');

const { Runtime } = require('../../huff/src');
const {
    p,
    pRed,
} = require('../js_snippets/bn128_reference');

const { expect } = chai;
const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');


function sliceMemory(memArray) {
    const numWords = Math.ceil(memArray.length / 32);
    const result = [];
    for (let i = 0; i < numWords * 32; i += 32) {
        result.push(new BN(memArray.slice(i, i + 32), 16));
    }
    return result;
}


describe.only('modular inverse', () => {
    let modInv;
    before(() => {
        modInv = new Runtime('modInv.huff', pathToTestData, true);
    });

    it('what I think is an inverse, actually IS an inverse!', () => {
        const exponent = p.sub(new BN(2));
        const z = new BN(crypto.randomBytes(32), 16).umod(p);
        const zRed = z.toRed(pRed);
        const zInv = zRed.redPow(exponent).fromRed();
        expect(z.mul(zInv).umod(p).eq(new BN(1))).to.equal(true);
    });

    it('macro CREATE_LOOKUP_ADDITION_CHAIN functions as expected', async () => {
        const z = new BN(crypto.randomBytes(32), 16).umod(p);
        const { stack } = await modInv('CREATE_LOOKUP_ADDITION_CHAIN', [z]);

        const expected = [
            z.pow(new BN(5)).umod(p),
            z.pow(new BN(21)).umod(p),
            z.pow(new BN(31)).umod(p),
            z.pow(new BN(27)).umod(p),
            z.pow(new BN(11)).umod(p),
            z.pow(new BN(1)).umod(p),
            z.pow(new BN(17)).umod(p),
            z.pow(new BN(15)).umod(p),
            z.pow(new BN(13)).umod(p),
            z.pow(new BN(7)).umod(p),
            z.pow(new BN(3)).umod(p),
            z.pow(new BN(23)).umod(p),
            p,
            z.pow(new BN(48)).umod(p),
        ];
        for (let i = 0; i < stack.length; i += 1) {
            expect(stack[i].eq(expected[i])).to.equal(true);
        }
    });

    it('macro MODINV correctly computes a modular inverse', async () => {
        const z = new BN(crypto.randomBytes(32), 16).umod(p);
        const zRed = z.toRed(pRed);
        const zInv = zRed.redInvm().fromRed();
        expect(z.mul(zInv).umod(p).eq(new BN(1))).to.equal(true);
        const { stack } = await modInv('MODINV', [z]);
        expect(stack.length).to.equal(1);
        expect(stack[0].mul(z).umod(p).eq(new BN(1))).to.equal(true);
    });

    it.only('macro MONTY_LOAD correctly computes z-factors', async () => {
        const numPoints = 6;
        const points = [...new Array(numPoints)].map(() => new BN(crypto.randomBytes(32), 16).umod(p));
        const calldata = points.reduce((acc, z, i) => {
            return ([
                ...acc,
                { index: (i * 96) + 32, value: new BN(0) },
                { index: (i * 96) + 64, value: new BN(0) },
                { index: (i * 96) + 96, value: z },
            ]);
        }, [{ index: 0, value: new BN(numPoints) }]);
        const { stack, returnValue } = await modInv('MONTY_LOAD', [], [], calldata);
        const returnWords = sliceMemory(returnValue);
        console.log('return words = ', returnWords);
        console.log(stack);

        let accumulator = new BN(1);
        console.log('points = ', points);
        console.log('hmm = ', points[5].mul(points[4]).umod(p));
        for (let i = 0; i < stack.length - 1; i += 6) {
            const index = 1 + i;
            const pointIndex = Math.round(i / 6);
            console.log('point index = ', pointIndex);
            console.log('points length = ', points.length - pointIndex - 1);
            accumulator = accumulator.mul(points[points.length - (pointIndex + 1)]).umod(p);
            console.log(accumulator);
            const expected = points[points.length - (pointIndex + 3)];
            console.log(i);
            expect(stack[index].eq(accumulator)).to.equal(true);
            expect(stack[index + 1].eq(p)).to.equal(true);
            expect(stack[index + 2].eq(p)).to.equal(true);
            expect(stack[index + 3].eq(p)).to.equal(true);
            expect(stack[index + 4].eq(p)).to.equal(true);
            expect(stack[index + 5].eq(expected)).to.equal(true);
        }
        // const accumulator = [points[0]];
        // const expectedPoints = [];
        // for (let i = 2; i < points.length; i += 1) {
        //     accumulator.push(accumulator[i].mul(points[i - 1]));
        //     expectedPoints.push(points[i]);
        // }
        // expect(stack.length).to.equal((numPoints - 2) * 6);
    });
});
