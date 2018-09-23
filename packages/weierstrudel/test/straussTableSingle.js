/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const StraussTableSingle = artifacts.require('../contracts/StraussTableSingle');
const StraussTableSingleInterface = artifacts.require('../contrats/StraussTableSingleInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

// p = 30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47

StraussTableSingle.abi = StraussTableSingleInterface.abi; // hon hon hon
contract('StraussTableSingle', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await StraussTableSingle.new();
    });

    it('method "straussTable" correctly calculates precompute lookup table for random point', async () => {
        const { x: x1, y: y1, z: z1 } = bn128Reference.randomPointJacobian();
        const resultOverloaded = await contract.generateTablePure(
            `0x${x1.toString(16)}`,
            `0x${y1.toString(16)}`,
            `0x${z1.toString(16)}`,
        );
        const normalized = resultOverloaded.map(r => new BN(r.toString(16), 16).umod(bn128Reference.p));
        assert(normalized.length === 24);

        const result = {
            p: normalized.slice(0, 17),
            dz: normalized.slice(17, 25),
        };
        // this is an intermediate fn and points are overloaded, and may be multiples of p
        // reduce down to mod p to validate against bn128
        const { p, dz } = bn128Reference.generateTableSingle(x1, y1, z1);

        for(let i = 0; i < p.length; i++) {
            const expected = p[i];
            assert(expected.x.toString(16) == result.p[2 * i].toString(16));
            assert(expected.y.toString(16) == result.p[(2 * i) + 1].toString(16));
        }
        for(let i = 0; i < dz.length; i++) {
            const expected = dz[i];
            assert(expected.toString(16) == result.dz[i].toString(16));
        }
        assert(p[p.length - 1].z.toString(16) == result.p[result.p.length - 1].toString(16));
    });

});