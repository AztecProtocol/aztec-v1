const chai = require('chai');
const BN = require('bn.js');
const crypto = require('crypto');
const path = require('path');

const toBytes32 = require('../js_snippets/toBytes32');
const { Runtime } = require('../../huff/src');
const {
    p,
    pRed,
} = require('../js_snippets/bn128_reference');

const { expect } = chai;
const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');


describe('modular inverse', () => {
    let modInv;
    before(() => {
        modInv = new Runtime('modInv.huff', pathToTestData);
    });

    it('what I think is an inverse, actually IS an inverse!', () => {
        const exponent = p.sub(new BN(2));
        const z = new BN(crypto.randomBytes(32), 16).umod(p);
        const zRed = z.toRed(pRed);
        const zInv = zRed.redPow(exponent).fromRed();
        expect(z.mul(zInv).umod(p).eq(new BN(1))).to.equal(true);
    });

    it('macro CREATE_LOOKUP_ADDITION_CHAIN computes hardcoded lookup table', async () => {
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
        expect(stack[0].eq(zInv)).to.equal(true);
    });

    it('macro MODINV__MAIN correctly computes a modular inverse from calldata', async () => {
        const z = new BN(crypto.randomBytes(32), 16).umod(p);
        const zRed = z.toRed(pRed);
        const zInv = zRed.redInvm().fromRed();
        expect(z.mul(zInv).umod(p).eq(new BN(1))).to.equal(true);
        const calldata = Buffer.from(toBytes32(z.toString(16)), 'hex');
        const { stack, returnValue } = await modInv('MODINV__MAIN', [], [], calldata);
        expect(stack.length).to.equal(0);
        expect(returnValue.length).to.equal(32);
        const result = new BN(returnValue, 16);
        expect(result.mul(z).umod(p).eq(new BN(1))).to.equal(true);
        expect(result.eq(zInv)).to.equal(true);
    });
});
