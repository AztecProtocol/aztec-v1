/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const Bn128DoubleAlternateAffine = artifacts.require('../contracts/Bn128DoubleAlternateAffine');
const Bn128DoubleAlternateAffineInterface = artifacts.require('../contrats/Bn128DoubleAlternateAffineInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

Bn128DoubleAlternateAffine.abi = Bn128DoubleAlternateAffineInterface.abi; // hon hon hon
contract('Bn128DoubleAlternateAffine', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await Bn128DoubleAlternateAffine.new();
    });

    it('method "double" correctly calculates point doubling on affine input coordinates', async () => {
        const { x, y } = bn128Reference.randomPoint();
        const resultOverloaded = await contract.doublePure(`0x${x.toString(16)}`, `0x${y.toString(16)}`);
        const result = resultOverloaded.map(r => new BN(r.toString(16), 16).umod(bn128Reference.p));
        // this is an intermediate fn and points are overloaded, and may be multiples of p
        // reduce down to mod p to validate against bn128
        const reference = bn128Reference.double(x, y, new BN(1));
        const yRed = y.toRed(bn128Reference.pRed);
        const xRed = x.toRed(bn128Reference.pRed);
        const y2 = yRed.redAdd(yRed);
        const yy4 = y2.redSqr();
        const s = xRed.redMul(yy4);
        const yyy8 = yy4.redMul(y2);
        const v = yyy8.redMul(yRed);
        assert(result.length === 5);
        assert(result[0].toString(16) === bn128Reference.p.sub(reference.x).toString(16));
        assert(result[1].toString(16) === reference.y.toString(16));
        assert(result[2].toString(16) === reference.z.toString(16));
        assert(result[3].toString(16) === s.fromRed().toString(16));
        assert(result[4].toString(16) === bn128Reference.p.sub(v.fromRed()).toString(16));


    });

});