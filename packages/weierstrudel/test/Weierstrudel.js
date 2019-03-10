/* global artifacts, expect, contract, beforeEach, it:true */

const Weierstrudel = artifacts.require('Weierstrudel');

contract('Weierstrudel contract tests', () => {
    beforeEach(async () => {
    });

    let weierstrudel;
    before(async () => {
        weierstrudel = await Weierstrudel.new();
    });


    it('Weierstrudel contract is deployed', async () => {
        const result = await weierstrudel.address;
        expect(result.length > 0).to.equal(true);
    });

    it('WeierstrudelCaller sort of works?', async () => {
        const result = await weierstrudel.ecBatchMul([[1, 2]], [100]);
        console.log(result.logs[0].args);
        console.log('result = ', result);
    });
});
