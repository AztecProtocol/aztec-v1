const chai = require('chai');
const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');

const { expect } = chai;


const testHelper = `
#include "./easm_modules/double.easm"
#include "./easm_modules/constants.easm"
#define DOUBLE_MAIN_IMPL = takes(3) returns(3) {
    DOUBLE_MAIN<P,P>()
}`;


describe('bn128 double', () => {
    let double;
    let doubleMain;
    before(() => {
        double = new Runtime('./easm_modules/double.easm');
        doubleMain = new Runtime(testHelper);
    });
    it('macro DOUBLE correctly calculates point doubling', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const { stack } = await double('DOUBLE', [bn128Reference.p, x, y, z]);
        const reference = bn128Reference.double(x, y, z);
        const [p, xOut, yOut, zOut] = stack;
        expect(p.eq(bn128Reference.p));

        // results are overloaded, normalize before comparison
        expect(xOut.umod(p).eq(reference.x)).to.equal(true);
        expect(yOut.umod(p).eq(reference.y)).to.equal(true);
        expect(zOut.umod(p).eq(reference.z)).to.equal(true);
    });

    it('macro DOUBLE_MAIN correctly calculates point doubling (inverted y)', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const yNeg = bn128Reference.p.sub(y);
        const { stack } = await doubleMain('DOUBLE_MAIN_IMPL', [x, yNeg, z]);
        const reference = bn128Reference.double(x, y, z);
        const [xOut, yOut, zOut] = stack;

        // results are overloaded, normalize before comparison
        expect(xOut.umod(bn128Reference.p).eq(reference.x)).to.equal(true);
        expect(yOut.umod(bn128Reference.p).eq(bn128Reference.p.sub(reference.y))).to.equal(true);
        expect(zOut.umod(bn128Reference.p).eq(reference.z)).to.equal(true);
    });
});
