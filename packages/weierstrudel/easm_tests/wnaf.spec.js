const Runtime = require('../parser/runtime');
const bn128Reference = require('../js_snippets/bn128_reference');
const chai = require('chai');
const referenceWnaf = require('../js_snippets/wnaf_reference_implementation');
const BN = require('bn.js');

const { expect, assert } = chai;


function sliceMemory(memArray) {
    const numWords = Math.ceil(memArray.length / 32);
    const result = [];
    for (let i = 0; i < numWords * 32; i += 32) {
        result.push(new BN(memArray.slice(i, i + 32), 16));
    }
    return result;
}

// const oldWords = [
//     new BN('0000016d02d06e1303dad1e66f8e14310469dbdfd280e7b070948f3b15bb3200', 16),
//     new BN('05476ae3dc38e0fbd3c881fee89eb120712695d690c43caa1640bccb330c00ed', 16), 
//     new BN('065248846b11e42fddae3900e1f9fc1ed4a8c9eb822dff1ce91a9fa1b26421a3', 16), 
//     new BN('727a27b49600d7669144c5233d4faba517774174bd5ccc7c34c00d290058eeb6', 16), 
//     new BN('075f539849f285006ccf12d9e58d3068de7faf933aba0046e237fac7fd9d1f25', 16), 
//     new BN('d5c3a93fca0bec5183102ead00f81da7ea2c1b19a063a279b3006543224ea476', 16), 
//     new BN('735b7bbf2857b55e97f100ced88c677e92b94536c69c24c23e0a500facf7a62b', 16), 
//     new BN('18627800424d755abe565df0cd8b7db8359bc1090ef62a61004c5955ef8ab79a', 16), 
//     new BN('08f5604b548999f44a88f3878600000000000000000000000000000000000000', 16),
// ];

// console.log('old result = ', oldWords);
// const words = (oldWords.map((w => w.mul(new BN(32)))));

// const result = [];
// let acc = new BN(0);
// for (let i = words.length - 1; i >= 0; i--) {
//     if (words[i].bitLength() <= 256) {
//         result[i] = (words[i]).or(acc);
//         acc = new BN(0);
//     } else {
//         result[i] = (words[i].maskn(256).or(acc));
//         acc = words[i].shrn(256);

//         console.log('acc = ', acc);
//     }
// }
// (result.forEach((r) => { console.log(`0x${r.toString(16)}`); }));
// console.log('new result = ', result);
// const shifted = (words.map((w => w.mul(new BN(32)))));
// shifted.forEach((s) => { console.log('s length = ', s.bitLength()); });
describe('sparse wnaf', () => {
    let wnaf;
    before(() => {
        wnaf = new Runtime('./easm_modules/wnaf.easm');
    });
    it('macro WNAF correctly calculates a w=5 windowed non adjacent form of a 254 bit number', async () => {
        let testVar = bn128Reference.randomPoint().x;
        const reference = referenceWnaf(testVar);
       // const { stack, memory } = await wnaf('WNAF', [], [], [{ index: 0, value: testVar }]);
       //  const second = await wnaf('NEW_WNAF_2', [], [], [{ index: 0, value: testVar }]);
        const { stack, memory } = await wnaf('ENDO_WNAF', [], [], [{ index: 0, value: testVar }]);
        const result = sliceMemory(memory);
        // const test = sliceMemory(second.memory);

        // expect(result.length).to.equal(test.length);
        
        // for(let i = 10; i < result.length; i += 1) {
        //     console.log('i = ', i);
        //     console.log(result[i], ' vs ', test[i]);
        //     expect(result[i].eq(test[i])).to.equal(true);
        // }
        // console.log(result);

    
    });
});