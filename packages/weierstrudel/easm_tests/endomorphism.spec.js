const Runtime = require('../parser/runtime');
const { n, lambda } = require('../js_snippets/bn128_reference');
const chai = require('chai');
const referenceWnaf = require('../js_snippets/wnaf_reference_implementation');
const BN = require('bn.js');
const crypto = require('crypto');

const { expect, assert } = chai;

describe('endomorphism split', () => {
    let endomorphism;
    before(() => {
        endomorphism = new Runtime('./easm_modules/endomorphism.easm');
    });
    it('macro ENDOMORPHISM correctly splits scalar k into half-length scalars k1, k2', async () => {
        let k = new BN(crypto.randomBytes(32), 16);
        const { stack } = await endomorphism('ENDOMORPHISM', [k]);
        expect(stack.length).to.equal(2);
        expect(stack[1].sub(stack[0].mul(lambda)).umod(n).eq(k.umod(n))).to.equal(true);
        expect(stack[1].bitLength() <= 128).to.equal(true);
        expect(stack[0].bitLength() <= 128).to.equal(true);
    });
});