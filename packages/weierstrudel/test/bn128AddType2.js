/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const Bn128AddType2 = artifacts.require('../contracts/Bn128AddType2');
const Bn128AddType2Interface = artifacts.require('../contrats/Bn128AddType2Interface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

// p = 30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47

Bn128AddType2.abi = Bn128AddType2Interface.abi; // hon hon hon
contract('Bn128AddType2', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await Bn128AddType2.new();
    });

    it('method "add" correctly calculates mixed point addition on input coordinates (type 2)', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const { x: x1, y: y1, z: z1 } = bn128Reference.randomPointJacobian();
        // const x2 = new BN('1', 10);
        // const y2 = new BN('2', 10);
        // const x1 = new BN('4', 10);
        // const y1 = new BN('16', 10);
        // const z1 = new BN('2', 10);
        const resultOverloaded = await contract.addPure(
            `0x${x2.toString(16)}`,
            `0x${y2.toString(16)}`,
            `0x${x1.toString(16)}`,
            `0x${y1.toString(16)}`,
            `0x${z1.toString(16)}`,
        );
        const result = resultOverloaded.map(r => new BN(r.toString(16), 16).umod(bn128Reference.p));
        // this is an intermediate fn and points are overloaded, and may be multiples of p
        // reduce down to mod p to validate against bn128
        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, z1);

        assert(result.length === 3);
        assert(result[0].toString(16) === reference.x.toString(16));
        assert(result[1].toString(16) === bn128Reference.p.sub(reference.y).toString(16));
        assert(result[2].toString(16) === reference.z.toString(16));
    });

});