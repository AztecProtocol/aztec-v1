/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const StraussTableFull = artifacts.require('../contracts/StraussTableFull');
const StraussTableFullInterface = artifacts.require('../contrats/StraussTableFullInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

// p = 30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47

StraussTableFull.abi = StraussTableFullInterface.abi; // hon hon hon
contract('StraussTableFull', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await StraussTableFull.new();
    });

    it('method "straussTableFull" correctly calculates precompute lookup table for random point set', async () => {
        let inputReference = [];
        let inputTxData = [];
        for(let i = 0; i < 2; i += 1) {
            const p = bn128Reference.randomPoint();
            inputTxData.push([`0x${p.x.toString(16)}`, `0x${p.y.toString(16)}`]);
            inputReference.push(p);
        }

        const outputReference = bn128Reference.generateTableMultiple(inputReference);
        const resultOverloaded = await contract.generateTablePure(inputTxData);
        const normalized = resultOverloaded.map(r => ({
            x: new BN(r[0].toString(16), 16).umod(bn128Reference.p),
            y: new BN(r[1].toString(16), 16).umod(bn128Reference.p),
        }));

        console.log(normalized);
        assert(normalized.length === (outputReference.length));
        for (let i = 0; i < outputReference.length; i += 1) {
            assert(normalized[i].x.toString(16) === outputReference[i].x.toString(16))
            assert(normalized[i].y.toString(16) === outputReference[i].y.toString(16));
        }
    });

});