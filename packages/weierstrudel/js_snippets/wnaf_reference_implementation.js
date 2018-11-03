const BN = require('bn.js');
const toBytes32 = require('./toBytes32');
const crypto = require('crypto');
// reference wnaf implenentation to test smart contract against.
// performs standard window NAF method of dividing-by-2 until least significant bit is high
function alternativeWnaf(scalar) {
    let next = scalar;
    let wnaf = [];
    let o = 0;
    let count = 0;
    while (!next.eq(new BN(0))) {
        const i = next.zeroBits();
        o = o + i;
        next = next.shrn(i);
        let m = next.and(new BN(31));
        wnaf[o] = m;
        if (m.gt(new BN(16))) {
            next = next.add(new BN(32));
        }
        next = next.sub(m);
        count++;
    }
 //   console.log('count = ', count);
}
// so count is from 20 to 23
// so we can hard-code 20 and then jump

for (let i = 0; i < 100; i++) {
    const scalar = new BN(crypto.randomBytes(32), 16).maskn(127);
    alternativeWnaf(scalar);
}


module.exports = function calculateWnaf(scalar) {
    // assume 'scalar' is a BN
    // phew what a mess
    const zero = new BN('0', 10);
    const one = new BN('1', 10);
    const two = new BN('2', 10);
    const fifteen = new BN('15', 10);
    const thirtyOne = new BN('31', 10);
    const thirtyTwo = new BN('32', 10);
    const twoFiveFive = new BN('255', 10);
    let i = 0;

    function recurse(currentScalar, iterator = 0, wnafArray = []) {
        if (currentScalar.eq(zero)) {
            return wnafArray;
        }
        if (currentScalar.and(one).eq(one)) {
            const m = currentScalar.and(thirtyOne);
            let newWnafArray = [...wnafArray];

            newWnafArray[iterator] = m;
            let newScalar = currentScalar.sub(m.and(thirtyOne));
            if (m.and(thirtyOne).gt(fifteen)) {
                newScalar = newScalar.add(thirtyTwo);
            }
            return recurse(newScalar.div(two), iterator += 1, newWnafArray);
        } else {
            return recurse(currentScalar.div(two), iterator += 1, [...wnafArray, new BN('0', 10)]);
        }
    }
    const wnafData = recurse(scalar);
    let lookupTableString = '';

    wnafData.forEach((val, index) => {
        const v = val || new BN('0', 10);
        const next = v.lt(new BN('16', 10)) ? `0${val.toString(16)}` : val.toString(16);
        lookupTableString = `${lookupTableString}${next}`;
    });

    const stringArray = function sliceWnafString(wnafString, accumulator = []) {
        if (wnafString && wnafString.length > 0) {
            return sliceWnafString(
                wnafString.slice(64, wnafString.length),
                [
                    ...accumulator,
                    wnafString.slice(0, 64),
                ]
            );
        }
        return accumulator;
    }(lookupTableString);

    return stringArray.map((s, i) => {
        if (i === stringArray.length - 1) {
            return new BN(toBytes32(s, 'right'), 16);
        } else {
            return new BN(s, 16);
        }
    });
}