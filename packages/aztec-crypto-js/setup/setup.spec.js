const chai = require('chai');
const BN = require('bn.js');

const setup = require('./setup');
const { K_MAX, K_MIN } = require('../params');
const bn128 = require('../bn128/bn128');

const { expect } = chai;

describe('setup.js tests', () => {
    it('setup.readSignature will retrieve well-formed elliptic curve points', async () => {
        const k = Math.floor(Math.random() * (K_MAX - K_MIN + 1)) + K_MIN;
        const point = await setup.readSignature(k);
        expect(BN.isBN(point.x)).to.equal(true);
        expect(BN.isBN(point.y)).to.equal(true);
    });

    it('setup.compress will correctly compress coordinate with even y', () => {
        const compressed = setup.compress(new BN(2), new BN(4));
        expect(compressed.eq(new BN(2))).to.equal(true);
    });

    it('setup.compress will correctly compress coordinate with odd y', () => {
        let compressed = setup.compress(new BN(2), new BN(1));
        expect(compressed.testn(255)).to.equal(true);
        compressed = compressed.maskn(255);
        expect(compressed.eq(new BN(2))).to.equal(true);
    });

    it('setup.decompress will correctly decompress a compressed coordinate', () => {
        const point = bn128.randomPoint();
        const { x, y } = setup.decompress(setup.compress(point.x.fromRed(), point.y.fromRed()));
        expect(x.eq(point.x.fromRed())).to.equal(true);
        expect(y.eq(point.y.fromRed())).to.equal(true);
    });
});
