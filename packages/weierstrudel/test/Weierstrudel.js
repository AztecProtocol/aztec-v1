/* global artifacts, expect, contract, beforeEach, it:true */

const Weierstrudel = artifacts.require('Weierstrudel');
const WeierstrudelCaller = artifacts.require('WeierstrudelCaller');

contract('Weierstrudel contract tests', (accounts) => {
    beforeEach(async () => {
    });

    let weierstrudel;
    let weierstrudelCaller;
    before(async () => {
        weierstrudel = await Weierstrudel.new();
        WeierstrudelCaller.link('LWeierstrudel', weierstrudel.address);
        weierstrudelCaller = await WeierstrudelCaller.new({
            from: accounts[0],
            value: 50,
        });
    });


    it('Weierstrudel contract is deployed', async () => {
        const result = await weierstrudel.address;
        expect(result.length > 0).to.equal(true);
    });

    it('WeierstrudelCaller sort of works?', async () => {
        const result = await weierstrudelCaller.ecBatchMul([[1, 2]], [100]);
        console.log(result.logs[0].args);
        console.log('result = ', result);
    });
});
