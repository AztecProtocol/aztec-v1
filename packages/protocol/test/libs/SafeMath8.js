/* eslint-disable no-underscore-dangle */
/* global artifacts, contract: true */
const truffleAssert = require('truffle-assertions');

const SafeMath8 = artifacts.require('./SafeMath8Test');

contract('SafeMath8', () => {
    let safeMath8;

    beforeEach(async () => {
        safeMath8 = await SafeMath8.new();
    });

    describe('Failure States', async () => {
        it('should fail if integer overflow is triggered', async () => {
            await truffleAssert.reverts(safeMath8._mul(253, 253));
        });

        it('should fail if integer overflow is triggered', async () => {
            await truffleAssert.reverts(safeMath8._add(254, 25));
        });

        it('should fail if integer underflow is triggered', async () => {
            await truffleAssert.reverts(safeMath8._sub(0, 25));
        });
    });
});
