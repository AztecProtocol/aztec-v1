/* global artifacts, expect, contract, beforeEach, web3, it:true */
const BN = require('bn.js');

const {
    pRed,
    toAffine,
} = require('../js_snippets/bn128_reference');

const { generatePointData } = require('../js_snippets/utils');

const Weierstrudel = artifacts.require('Weierstrudel');
const Monty = artifacts.require('Monty');
const WeierstrudelCaller = artifacts.require('WeierstrudelCaller');

function decodeJacobianResult(output) {
    const result = web3.eth.abi.decodeParameter('uint[3]', output);
    const x = new BN(result[0], 10).toRed(pRed);
    const y = new BN(result[1], 10).toRed(pRed);
    const z = new BN(result[2], 10).toRed(pRed);
    return toAffine({ x, y, z });
}


function decodeAffineResult(output) {
    const result = web3.eth.abi.decodeParameter('uint[2]', output);
    const x = new BN(result[0], 10).toRed(pRed);
    const y = new BN(result[1], 10).toRed(pRed);
    return { x, y };
}

contract('Weierstrudel contract tests', (accounts) => {
    beforeEach(async () => {
    });

    let weierstrudel;
    let monty;
    let weierstrudelCaller;
    before(async () => {
        weierstrudel = await Weierstrudel.new();
        monty = await Monty.new();
        WeierstrudelCaller.link('WeierstrudelStub', weierstrudel.address);
        WeierstrudelCaller.link('MontyStub', monty.address);
        weierstrudelCaller = await WeierstrudelCaller.new();
    });


    it('Weierstrudel contract is deployed', async () => {
        const result = await weierstrudel.address;
        expect(result.length > 0).to.equal(true);
    });

    it('Weierstrudel performs scalar multiplication for 1-15 points', async () => {
        const transactionData = [...new Array(15)].map((_, i) => {
            return generatePointData(i + 1);
        });
        const transactions = transactionData.map(({ calldata }) => {
            return web3.eth.call({
                from: accounts[0],
                to: weierstrudel.address,
                data: `0x${calldata.toString('hex')}`,
            });
        });
        const resultData = await Promise.all(transactions);
        resultData.forEach((output, i) => {
            const result = decodeJacobianResult(output);
            const { expected } = transactionData[i];
            expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
            expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
        });
    }).timeout(100000);


    it('Weierstrudel performs scalar multiplication for 1-15 points and Monty normalizes to affine', async () => {
        const transactionData = [...new Array(15)].map((_, i) => {
            return generatePointData(i + 1);
        });
        const transactions = transactionData.map(({ calldata }) => {
            return web3.eth.call({
                from: accounts[0],
                to: weierstrudel.address,
                data: `0x${calldata.toString('hex')}`,
            });
        });
        const weierstrudelResultData = await Promise.all(transactions);

        const montyTransactions = weierstrudelResultData.map((output) => {
            return web3.eth.call({
                from: accounts[0],
                to: monty.address,
                data: output,
            });
        });

        const resultData = await Promise.all(montyTransactions);

        resultData.forEach((output, i) => {
            const result = decodeAffineResult(output);
            const { expected } = transactionData[i];
            expect(result.x.fromRed().eq(expected.x.fromRed())).to.equal(true);
            expect(result.y.fromRed().eq(expected.y.fromRed())).to.equal(true);
        });
    }).timeout(100000);

    it('Weierstrudel caller succeeds in comparing Weierstrudel with precompile', async () => {
        const result = await weierstrudelCaller.ecTest();
        expect(result).to.equal(true);
    });
});
