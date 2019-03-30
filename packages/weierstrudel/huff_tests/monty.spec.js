const chai = require('chai');
const BN = require('bn.js');
const path = require('path');
const toBytes32 = require('../js_snippets/toBytes32');
const { Runtime } = require('../../huff/src');
const {
    p,
    randomPointJacobian,
    toAffine,
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


function generatePointDataJacobian(numPoints) {
    const expected = [...new Array(numPoints)].map(() => randomPointJacobian());
    const calldata = expected.map((point) => {
        return [
            toBytes32(point.x.toString(16)),
            toBytes32(point.y.toString(16)),
            toBytes32(point.z.toString(16)),
        ].join('');
    }).join('');
    return {
        calldata: Buffer.from(calldata, 'hex'),
        expected,
    };
}


describe('MONTY - Montgomery batch inverses', () => {
    let monty;
    before(() => {
        monty = new Runtime('monty.huff', pathToTestData, true);
    });

    it('macro MONTY__LOAD correctly computes initial z factors', async () => {
        const transcripts = [...new Array(100)].map((_, i) => {
            return generatePointDataJacobian(i);
        });
        const testPromises = transcripts.map(({ calldata }) => {
            return monty('MONTY__LOAD', [], [], calldata);
        });
        const results = await Promise.all(testPromises);
        results.forEach(({ stack }, instance) => {
            const { expected } = transcripts[instance];
            const numPoints = instance;
            let accumulator = new BN(1);
            for (let i = 0; i < stack.length; i += 8) {
                const offset = i / 8;
                const j = numPoints - offset - 1;
                if (i > 0) {
                    accumulator = accumulator.mul(expected[j + 1].z).umod(p);
                }
                expect(stack[i].eq(p)).to.equal(true);
                expect(stack[i + 1].eq(expected[j].z)).to.equal(true);
                expect(stack[i + 2].eq(accumulator)).to.equal(true);
                expect(stack[i + 3].eq(p)).to.equal(true);
                expect(stack[i + 4].eq(expected[j].y)).to.equal(true);
                expect(stack[i + 5].eq(p)).to.equal(true);
                expect(stack[i + 6].eq(expected[j].x)).to.equal(true);
                expect(stack[i + 7].eq(p)).to.equal(true);
            }
        });
    }).timeout(100000);

    it('macro MONTY__MAIN correctly converts jacobian points to affine coordinates', async () => {
        const transcripts = [...new Array(100)].map((_, i) => {
            const { calldata, expected: expectedJacobian } = generatePointDataJacobian(i);
            const expected = expectedJacobian.map(point => toAffine(point));
            return { calldata, expected };
        });
        const testPromises = transcripts.map(({ calldata }) => {
            return monty('MONTY__MAIN', [], [], calldata);
        });
        const results = await Promise.all(testPromises);
        results.forEach(({ stack, returnValue }, instance) => {
            const { expected } = transcripts[instance];
            const numPoints = instance;
            const returnWords = sliceMemory(returnValue);
            expect(stack.length).to.equal(0);
            expect(returnWords.length).to.equal(numPoints * 2);
            for (let i = 0; i < returnWords.length; i += 2) {
                expect(returnWords[i].eq(expected[(i / 2)].x.fromRed())).to.equal(true);
                expect(returnWords[i + 1].eq(expected[(i / 2)].y.fromRed())).to.equal(true);
            }
        });
    }).timeout(100000);
});
