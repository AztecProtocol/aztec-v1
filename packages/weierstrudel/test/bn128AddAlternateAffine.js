/* global artifacts, assert, contract, beforeEach, it:true */
const BN = require('bn.js');
const crypto = require('crypto');

const Bn128AddAlternateAffine = artifacts.require('../contracts/Bn128AddAlternateAffine');
const Bn128AddAlternateAffineInterface = artifacts.require('../contrats/Bn128AddAlternateAffineInterface');

const bn128Reference = require('../js_snippets/bn128_reference.js');

// p = 30644E72E131A029B85045B68181585D97816A916871CA8D3C208C16D87CFD47

Bn128AddAlternateAffine.abi = Bn128AddAlternateAffineInterface.abi; // hon hon hon
contract('Bn128AddAlternateAffine', (accounts) => {
    let contract;
    beforeEach(async () => {
        contract = await Bn128AddAlternateAffine.new();
    });

    it('method "addAlternateAffine" correctly calculates mixed point addition on input coordinates', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        const { x: x1, y: y1 } = bn128Reference.randomPoint();
        const { zz, zzz } = bn128Reference.zFactors({ x2, y2 }, { x1, y1, z1: new BN(1) });
        const resultOverloaded = await contract.addPure(
            `0x${x1.toString(16)}`,
            `0x${y1.toString(16)}`,
            `0x${x2.toString(16)}`,
            `0x${y2.toString(16)}`,
        );
        const result = resultOverloaded.map(r => new BN(r.toString(16), 16).umod(bn128Reference.p));
        // this is an intermediate fn and points are overloaded, and may be multiples of p
        // reduce down to mod p to validate against bn128
        const reference = bn128Reference.mixedAdd(x2, y2, x1, y1, new BN(1));

        const pReference = bn128Reference.p.umod(bn128Reference.p);
        assert(result.length === 11);
        assert(result[0].toString(16) === reference.z.toString(16));
        assert(result[1].toString(16) === bn128Reference.p.sub(reference.y).toString(16));
        assert(result[2].toString(16) === reference.x.toString(16));
        assert(result[3].toString(16) === pReference.toString(16));
        assert(result[4].toString(16) === zz.toString(16));
        assert(result[5].toString(16) === pReference.toString(16));
        assert(result[6].toString(16) === pReference.toString(16));
        assert(result[7].toString(16) === zzz.toString(16));
        assert(result[8].toString(16) === pReference.toString(16));
        assert(result[9].toString(16) === bn128Reference.p.sub(y1).toString(16));
        assert(result[10].toString(16) === x1.toString(16));
    });

    it('method "addAlternate" will throw if points are equivalent', async () => {
        const { x: x2, y: y2 } = bn128Reference.randomPoint();
        try {
            const resultOverloaded = await contract.addPure(
                `0x${x1.toString(16)}`,
                `0x${y1.toString(16)}`,
                `0x${x1.toString(16)}`,
                `0x${y1.toString(16)}`,
            );
            expect(true === false);
        } catch (e) {
            expect(e);
        }
    });

});