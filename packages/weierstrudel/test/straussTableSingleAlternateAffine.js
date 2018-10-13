/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const StraussTableSingleAlternateAffine = artifacts.require('../contracts/StraussTableSingleAlternateAffine');
const StraussTableSingleAlternateAffineInterface = artifacts.require('../contrats/StraussTableSingleAlternateAffineInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

// p = 30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47

StraussTableSingleAlternateAffine.abi = StraussTableSingleAlternateAffineInterface.abi; // hon hon hon
contract('StraussTableSingleAlternateAffine', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await StraussTableSingleAlternateAffine.new();
    });

    it('method "straussTableAlternateAffine" correctly calculates precompute lookup table for random point', async () => {
        const { x: x1, y: y1 } = bn128Reference.randomPoint();
        const resultOverloaded = await contract.generateTablePure(
            `0x${x1.toString(16)}`,
            `0x${y1.toString(16)}`,
        );
        const result = resultOverloaded.map(r => new BN(r.toString(16), 16).umod(bn128Reference.p));
        assert(result.length === 59);
        const { p, dz } = bn128Reference.generateTableSingle(x1, y1, new BN(1));
        for(let i = 0; i < p.length; i++) {
            const resultIndex = 1 + (i * 8);
            const expected = p[p.length - 1 - i];
            //console.log('resultIndex = ', resultIndex);
            for (let j = 0; j < 8; j++) {
                //console.log('result at j ', j, ' = ', result[resultIndex + j].toString(16));
            }
            console.log('result = ', result);
            assert(expected.x.toString(16) === result[resultIndex + 1].toString(16));
            assert(expected.y.toString(16) === bn128Reference.p.sub(result[resultIndex]).toString(16));
            if (i !== p.length - 1) {
                const u = dz[dz.length - 1 - i];
                const zz = u.mul(u).umod(bn128Reference.p);
                const zzz = zz.mul(u).umod(bn128Reference.p);
                console.log('zz = ', zz.toString(16));
                console.log('zzz = ', zzz.toString(16));
                console.log('ri + 3 = ', result[resultIndex + 3].toString(16));
                console.log('ri + 6 = ', result[resultIndex + 6].toString(16));
                // z y x p t2 p p t3 p
                assert(zz.toString(16) === result[resultIndex + 3].toString(16));
                assert(zzz.toString(16) === result[resultIndex + 6].toString(16));
            }
        }
        assert(p[p.length - 1].z.toString(16) === result[0].toString(16));
    });

});

// y x p zz p p zzz p