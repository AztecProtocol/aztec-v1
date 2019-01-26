const chai = require('chai');
const path = require('path');

const { Runtime } = require('../huff');

const { expect } = chai;
const pathToTestData = path.posix.resolve(__dirname, '../huff_modules');

const testHelper = `
template <b>
#define macro COMPILER_ADD_TEST_INNER = takes(0) returns(0) {
    <b>
}

#define macro A = takes(0) returns(0) { 0x10 }

template <x>
#define macro COMPILER_ADD_TEST = takes(0) returns(0) {
    COMPILER_ADD_TEST_INNER<0x01>()
    COMPILER_ADD_TEST_INNER<0x01+0x02>()
    COMPILER_ADD_TEST_INNER<x+0x03>()
    COMPILER_ADD_TEST_INNER<x+0x04>()
    COMPILER_ADD_TEST_INNER<0x05+x>()
    COMPILER_ADD_TEST_INNER<x+0x04+x+0x02>()
    COMPILER_ADD_TEST_INNER<0x01+10>()
}

#define macro COMPILER_ADD_TEST_ENTRY = takes(0) returns(0) {
    COMPILER_ADD_TEST<0x10>()
}
`;

describe('template tests', () => {
    let test;
    before(() => {
        test = new Runtime(testHelper, pathToTestData);
    });
    it('template addition works as expected', async () => {
        const { stack } = await test('COMPILER_ADD_TEST_ENTRY', [], [], []);
        expect(stack.length).to.equal(7);
        expect(stack[0].toString(10)).to.equal('1');
        expect(stack[1].toString(10)).to.equal('3');
        expect(stack[2].toString(10)).to.equal('19');
        expect(stack[3].toString(10)).to.equal('20');
        expect(stack[4].toString(10)).to.equal('21');
        expect(stack[5].toString(10)).to.equal('38');
        expect(stack[6].toString(10)).to.equal('11');
    });
});
