const BN = require('bn.js');

const wnafReference = {};

wnafReference.countNonzeroEntries = (wnaf) => {
    return wnaf.reduce((result, entry) => {
        return entry ? result + 1 : result;
    }, 0);
};

wnafReference.wnaf = (scalar) => {
    let next = scalar;
    const wnaf = [...new Array(128)];
    let o = 0;
    while (!next.eq(new BN(0))) {
        const i = next.zeroBits();
        o += i;
        next = next.shrn(i);
        const m = next.and(new BN(31));
        wnaf[o] = m;
        if (m.gt(new BN(16))) {
            next = next.add(new BN(32));
        }
        next = next.sub(m);
    }
    return wnaf;
};

wnafReference.recoverWnaf = (wnaf) => {
    return wnaf.reduce((result, entry, index) => {
        if (entry) {
            if (entry.gt(new BN(15))) {
                return result.sub(new BN(32).sub(entry).shln(index));
            }
            return result.add(entry.shln(index));
        }
        return result;
    }, new BN(0));
};

module.exports = wnafReference;

/*
module.exports = function calculateWnaf(scalar) {
    // assume 'scalar' is a BN
    // phew what a mess
    const zero = new BN('0', 10);
    const one = new BN('1', 10);
    const two = new BN('2', 10);
    const fifteen = new BN('15', 10);
    const thirtyOne = new BN('31', 10);
    const thirtyTwo = new BN('32', 10);

    function recurse(currentScalar, iterator = 0, wnafArray = []) {
        if (currentScalar.eq(zero)) {
            return wnafArray;
        }
        if (currentScalar.and(one).eq(one)) {
            const m = currentScalar.and(thirtyOne);
            const newWnafArray = [...wnafArray];

            newWnafArray[iterator] = m;
            let newScalar = currentScalar.sub(m.and(thirtyOne));
            if (m.and(thirtyOne).gt(fifteen)) {
                newScalar = newScalar.add(thirtyTwo);
            }
            return recurse(newScalar.div(two), iterator + 1, newWnafArray);
        }
        return recurse(currentScalar.div(two), iterator + 1, [...wnafArray, new BN('0', 10)]);
    }
    const wnafData = recurse(scalar);
    return wnafData;
};
*/
