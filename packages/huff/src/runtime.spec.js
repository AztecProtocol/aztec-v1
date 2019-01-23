const chai = require('chai');
const BN = require('bn.js');
const path = require('path');
const Runtime = require('./runtime');

const { expect } = chai;

const pathToTestData = path.posix.resolve(__dirname, '../testData');

const testHelper = `
#include "double.huff"
#include "constants.huff"
#define macro DOUBLE__MAIN_IMPL = takes(3) returns(3) {
    DOUBLE__MAIN<P,P>()
}

#define macro X2 = takes(0) returns(1) { 0x00 }
#define macro Y2 = takes(0) returns(1) { 0x20 }
#define macro Z2 = takes(0) returns(1) { 0x40 }

#define macro DOUBLE__PRECOMPUTE_TABLE_B_IMPL = takes(3) returns(3) {
    DOUBLE__PRECOMPUTE_TABLE_B<P,P,X2,Y2,Z2>()
}
`;

describe('runtime tests using double algorithm', () => {
    let double;
    let inputStack;
    let expected;
    before(() => {
        double = new Runtime(testHelper, pathToTestData);
        inputStack = [
            new BN('30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47', 16),
            new BN('bed36146b88c48f014c6b1ac1c8441ac0291e66462c432021914cc887dd0d75', 16),
            new BN('14f5a63645c1cd318e0720ac3ae1f3c164462b5a96b288ce6f45b62e2fb220ab', 16),
            new BN('29185780978972d99ce22b0543d90143dacc611fff75d4705b6ac867892ee2d8', 16),
        ];
    });
    it('macro DOUBLE correctly calculates point doubling', async () => {
        const { stack } = await double('DOUBLE', inputStack);
        expected = [
            new BN('30644e72e131a029b85045b68181585d97816a916871ca8d3c208c16d87cfd47', 16),
            new BN('55f8cabad8ae94c14c1482e3e20f7ce889e3143949181f404b04da8df02029ba', 16),
            new BN('43662fe9d0effbc8820577509b7454a46758301a4eedd592e61e6e357f4f4667', 16),
            new BN('f8caadab040dc22bcd17b3dd99820ba0f9fc34582ab692cbca1f914c48cbad8', 16),
        ];
        expect(stack[0].eq(expected[0])).to.equal(true);
        expect(stack[1].eq(expected[1])).to.equal(true);
        expect(stack[2].eq(expected[2])).to.equal(true);
        expect(stack[3].eq(expected[3])).to.equal(true);
    });

    it('macro DOUBLE__MAIN correctly calculates point doubling (inverted y)', async () => {
        const { stack } = await double('DOUBLE__MAIN_IMPL', inputStack.slice(1));
        expected = [
            new BN('55f8cabad8ae94c14c1482e3e20f7ce889e3143949181f404b04da8df02029ba', 16),
            new BN('4dc6bb6ed2a4e4b4a6eb59d2e90fb4745f2c0f99ea678a14ce43360f0a27b16e', 16),
            new BN('20d7a39830f0c406fb7eca78a7e937a387e1a74be5c661607f7e930213f0426f', 16),
        ];
        expect(stack[0].eq(expected[0])).to.equal(true);
        expect(stack[1].eq(expected[1])).to.equal(true);
        expect(stack[2].eq(expected[2])).to.equal(true);
    });
});
