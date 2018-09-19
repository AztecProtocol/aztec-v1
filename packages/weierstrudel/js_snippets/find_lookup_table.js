const BN = require('bn.js');


function removeDuplicates(arr) {
    return arr.reduce((unique, val) => {
        let found = false;
        unique.forEach((t) => {
            if (val.eq(t)) {
                found = true;
            }
        });
        if (!found) {
            return [...unique, val];
        } else {
            return unique;
        }
    }, []);
}

// console.log(removeDuplicates([new BN(1, 16), new BN(2, 16), new BN(3, 16), new BN(4, 16), new BN(5, 16)]));
// console.log(removeDuplicates([new BN(1, 16), new BN(2, 16), new BN(2, 16), new BN(1, 16)]));

const bnTestValues = function generateTestVariables() {
    let ret = [];
    for (let i = 0; i < 256; i += 1) {
        let t = new BN(2, 10);
        t = t.pow(new BN(i, 10));
        ret.push(t);
    }
    return ret;
}();


// const bnTestValues = generateTestVariables();

console.log('test values = ', bnTestValues);

function testModValue(modValue) {
    const remainders = bnTestValues.map(v => v.mod(modValue));
    const uniques = removeDuplicates(remainders);
    if (uniques.length === 256) {
        return uniques;
    } else {
        return false;
    }
}

let i = 0;
let found = false;
while (!found) {
    i += 1;
    console.log('calling testModValue with i = ', i);
    found = testModValue(new BN(i, 10));
}

console.log('found a value? ', i);
found.forEach(v => console.log(v));

const lookupTable = new Uint8Array(i);

found.forEach((value, index) => {
    // ok, so what's going on here. The index is the thing I want to return,
    // the value is what gets returned after the mod operation
    // so at byte position 'value', we need 'index'
    console.log('value to string = ', value.toString(10));
    console.log('inde to string = ', index.toString(10));
    lookupTable[value.toString(10)] = index.toString(10);
});
// console.log('array = ', found);

let lookupTableString = '';
lookupTable.forEach((val) => {
    let next = '';
    if (val.toString(10) < 16) {
        next = `0${val.toString(16)}`;
    } else {
        next = val.toString(16);
    }
    lookupTableString = `${lookupTableString}${next}`;
});

console.log('lookup table ? = ', lookupTable.toString(16));
console.log('lookup table string? ', lookupTableString);

console.log('lookup table length = ', lookupTable.length);
console.log('###');
console.log(lookupTableString.slice(0, 64));
console.log(lookupTableString.slice(64, 128));
console.log(lookupTableString.slice(128, 192));
console.log(lookupTableString.slice(192, 256));
console.log(lookupTableString.slice(256, 320));
console.log(lookupTableString.slice(320, 384));
console.log(lookupTableString.slice(384, 448));
console.log(lookupTableString.slice(448, 512));
console.log(lookupTableString.slice(512, 576));

console.log(lookupTableString.length);
// hmm, so 269 works? not so bad...
// the hallowed constant...
/*
0000016d02d06e01303dad1e66f8e014310469dbdfd280e7b070948f3b015bb3
20005476ae3dc38e0fbd3c881fee89eb120712695d690c43caa1640bccb33c00
ed065248846b011e42fddae3900e1f9fc1ed4a8c9eb822dff1ce91a9fa1b2642
1a3727a27b49600d7669144c5233d4faba517774174bd5ccc7c34c0d290058ee
b6075f539849f285006ccf012d9e58d3068de7faf933aba0046e237fac7fd9d1
f25d5c3a93fcabec51830102ead00f81da7ea2c1b19a063a279b3006543224ea
476735b7bbf2857b55e97f100ced88c677e92b94536c69c24c23ea50facf7a62
b18627800424d755abe565df0cd8b7db8359bc109ef62a61004c5955ef8ab79a
08f5604b548999f44a88f38786
*/