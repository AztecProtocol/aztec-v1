const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');
const chai = require('chai');

const { expect, assert } = chai;

describe('bn128 double', () => {
    let double;
    before(() => {
        double = new Runtime('./easm_modules/double.easm');
    });
    it('macro DOUBLE correctly calculates point doubling', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const { stack } = await double('DOUBLE', [bn128Reference.p, x, y, z])
        const reference = bn128Reference.double(x, y, z);
        const [p, xOut, yOut, zOut] = stack;
        expect(p.eq(bn128Reference.p));
        // results are overloaded, normalize before comparison
        expect(xOut.umod(p).eq(reference.x)).to.equal(true);
        expect(yOut.umod(p).eq(reference.y)).to.equal(true);
        expect(zOut.umod(p).eq(reference.z)).to.equal(true);
    });
});