/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const StraussTable = artifacts.require('../contracts/StraussTable');
const StraussTableInterface = artifacts.require('../contrats/StraussTableInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

// p = 30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47

StraussTable.abi = StraussTableInterface.abi; // hon hon hon
contract('StraussTable', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await StraussTable.new();
    });

    it('method "straussTable" correctly calculates precompute lookup table for random point', async () => {
        const { x: x1, y: y1, z: z1 } = bn128Reference.randomPointJacobian();
        const resultOverloaded = await contract.generateTablePure(
            `0x${x1.toString(16)}`,
            `0x${y1.toString(16)}`,
            `0x${z1.toString(16)}`,
        );
        const result = resultOverloaded.map(r => new BN(r.toString(16), 16).umod(bn128Reference.p));

        // this is an intermediate fn and points are overloaded, and may be multiples of p
        // reduce down to mod p to validate against bn128
        const p = bn128Reference.generateTableSingle(x1, y1, z1);

        assert(result.length === 17);
        for(let i = 0; i < p.length; i++) {
            const expected = p[i];
            assert(expected.x.toString(16) == result[2 * i].toString(16));
            assert(expected.y.toString(16) == result[(2 * i) + 1].toString(16));
        }
        assert(p[p.length - 1].z.toString(16) == result[result.length - 1].toString(16));
    });

});