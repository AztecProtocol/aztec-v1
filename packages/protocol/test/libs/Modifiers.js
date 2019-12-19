/* global artifacts, contract, expect, it: true */
const truffleAssert = require('truffle-assertions');
const { randomHex } = require('web3-utils');

const ModifierTest = artifacts.require('./test/ModifiersTest');

contract('Modifiers', async () => {
    let modifier;

    beforeEach(async () => {
        modifier = await ModifierTest.new();
    });

    it('should revert when 0x0 address passed', async () => {
        const zeroAddress = '0x0000000000000000000000000000000000000000';
        await truffleAssert.reverts(modifier.testCheckZeroAddress(zeroAddress), 'address can not be 0x0');
    });

    it('should not revert when a non-0x0 address passed', async () => {
        const nonZeroAddress = randomHex(20);
        const result = await modifier.testCheckZeroAddress(nonZeroAddress);
        expect(result).to.equal(true);
    });
});
