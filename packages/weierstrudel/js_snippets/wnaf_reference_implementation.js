const BN = require('bn.js');
const toBytes32 = require('./toBytes32');
// reference wnaf implenentation to test smart contract against.
// performs standard window NAF method of dividing-by-2 until least significant bit is high
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
            const m = currentScalar.and(twoFiveFive);
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