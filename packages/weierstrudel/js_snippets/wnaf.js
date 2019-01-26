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
