/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const StraussTableFullAlternate = artifacts.require('../contracts/StraussTableFullAlternate');
const StraussTableFullAlternateInterface = artifacts.require('../contrats/StraussTableFullAlternateInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

// p = 30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47

StraussTableFullAlternate.abi = StraussTableFullAlternateInterface.abi; // hon hon hon
contract('StraussTableFullAlternate', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await StraussTableFullAlternate.new();
    });

    it('method "straussTableFullAlternate" correctly calculates precompute lookup table for random point set', async () => {
        let inputReference = [];
        let inputTxData = [];
        // for(let i = 0; i < 2; i += 1) {
        //     const p = bn128Reference.randomPoint();
        //     inputTxData.push([`0x${p.x.toString(16)}`, `0x${p.y.toString(16)}`]);
        //     inputReference.push(p);
        // }
        inputTxData = [[1,2], [1,2]];
        inputReference = [{ x: new BN(1), y: new BN(2) }, { x: new BN(1), y: new BN(2) }];
        const outputReference = bn128Reference.generateTableMultiple(inputReference);
        const resultOverloaded = await contract.generateTablePure(inputTxData);
        // const resultPoints = resultOverloaded.slice(1);
        // const resultGlobalZ = new BN(resultOverloaded[0].toString(16), 16).umod(bn128Reference.p);
        // console.log('result global z = ', resultGlobalZ.toString(16));
        const normalized = resultOverloaded.map(r => ({
            x: new BN(r[0].toString(16), 16).umod(bn128Reference.p),
            y: (bn128Reference.p.sub(new BN(r[1].toString(16), 16)).umod(bn128Reference.p)),
        }));
        console.log('normalized length = ', normalized.length);
        console.log('output reference length = ', outputReference.length);
        assert(normalized.length === (outputReference.length));
        console.log('normalized = ', normalized);
        console.log('output reference = ', outputReference);
        for (let i = 0; i < outputReference.length; i += 1) {
            console.log('i = ', i);
            assert(normalized[i].x.toString(16) === outputReference[i].x.toString(16));
            assert(normalized[i].y.toString(16) === outputReference[i].y.toString(16));
        }
    });

});

// how can the x coordinates be correct but the y coordinates are wrong?
// the addition algorithms must be accurate
// so the rescaling algo is wrong?