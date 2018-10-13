/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const Bn128DoubleAlternate = artifacts.require('../contracts/Bn128DoubleAlternate');
const Bn128DoubleAlternateInterface = artifacts.require('../contrats/Bn128DoubleAlternateInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

Bn128DoubleAlternate.abi = Bn128DoubleAlternateInterface.abi; // hon hon hon
contract('Bn128DoubleAlternate', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await Bn128DoubleAlternate.new();
    });

    it('method "double" correctly calculates point doubling on input coordinates', async () => {
        const { x, y, z } = bn128Reference.randomPointJacobian();
        const resultOverloaded = await contract.doublePure(`0x${x.toString(16)}`, `0x${y.toString(16)}`, `0x${z.toString(16)}`);
        const result = resultOverloaded.map(r => new BN(r.toString(16), 16).umod(bn128Reference.p));
        // this is an intermediate fn and points are overloaded, and may be multiples of p
        // reduce down to mod p to validate against bn128
        const reference = bn128Reference.double(x, y, z);
        assert(result.length === 3);
        assert(result[0].toString(16) === bn128Reference.p.sub(reference.x).toString(16));
        assert(result[1].toString(16) === reference.y.toString(16));
        assert(result[2].toString(16) === reference.z.toString(16));
    });

});