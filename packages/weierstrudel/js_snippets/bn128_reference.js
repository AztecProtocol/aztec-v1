/* eslint-disable no-underscore-dangle */
const BN = require('bn.js');
const crypto = require('crypto');

const n = new BN('30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001', 16);
const p = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);
const pRed = BN.red(p);

// bn128 weierstrass formula = y^2 = x^3 + 3
const b = new BN('3', 10).toRed(pRed);
const beta = new BN('59e26bcea0d48bacd4f263f1acdb5c4f5763473177fffffe', 16);
const lambda = new BN('b3c4d79d41a917585bfc41088d8daaa78b17ea66b99c90dd', 16);

// TODO create point helper class

function setRed(point) {
    let { x, y, z } = point;
    if (!x.red) { x = x.toRed(pRed); }
    if (!y.red) { y = y.toRed(pRed); }
    if (z && !z.red) { z = z.toRed(pRed); }
    return { x, y, z };
}

const bn128 = {};

bn128.p = p;
bn128.pRed = pRed;
bn128.n = n;
bn128.lambda = lambda;
bn128.beta = beta;
bn128.basis = [
    {
        a: new BN('89d3256894d213e3', 16),
        b: new BN('-6f4d8248eeb859fc8211bbeb7d4f1128', 16), // 30644e72e131a029b85045b68181585e06ceecda572a2489be32480255cc0e6f need this?
    },
    {
        a: new BN('6f4d8248eeb859fd0be4e1541221250b', 16),
        b: new BN('89d3256894d213e3', 16),
    },
];

bn128._double = function _double({ x, y, z }) {
    const xx = x.redSqr();
    const yy = y.redSqr();
    const yyyy = yy.redSqr();
    const zz = z.redSqr();
    let s = x.redAdd(yy).redSqr().redSub(xx).redSub(yyyy);
    s = s.redAdd(s);
    const m = xx.redAdd(xx).redAdd(xx);
    const t = m.redSqr().redSub(s).redSub(s);
    const x3 = t;
    let yyyy8 = yyyy.redAdd(yyyy);
    yyyy8 = yyyy8.redAdd(yyyy8);
    yyyy8 = yyyy8.redAdd(yyyy8);
    const y3 = s.redSub(t).redMul(m).redSub(yyyy8);
    const z3 = y.add(z).redSqr().redSub(yy).redSub(zz);
    return {
        x: x3,
        y: y3,
        z: z3,
    };
};

bn128._mixedAdd = function _mixedAdd({ x2, y2 }, { x1, y1, z1 }) {
    let t1 = z1.redSqr();
    let t2 = t1.redMul(z1);
    t1 = t1.redMul(x2);
    t2 = t2.redMul(y2);
    t1 = x1.redSub(t1);
    t2 = t2.redSub(y1);
    const z3 = z1.redMul(t1);
    let t4 = t1.redSqr();
    t1 = t1.redMul(t4);
    t4 = t4.redMul(x1);
    let x3 = t2.redSqr();
    x3 = x3.redAdd(t1);
    let y3 = t1.redMul(y1);
    t1 = t4.redAdd(t4);
    x3 = x3.redSub(t1);
    t4 = x3.redSub(t4);
    t4 = t4.redMul(t2);
    y3 = t4.redSub(y3);
    return {
        x: x3,
        y: y3,
        z: z3,
    };
};

bn128._add = function _add(x2, y2, z2, x1, y1, z1) {
    let t1 = z1.redSqr();
    let t2 = t1.redMul(z1);
    const zz2 = z2.redSqr();
    const zzz2 = z2.redMul(z2);
    t1 = t1.redMul(x2);
    t2 = t2.redMul(y2);
    t1 = (x1.redMul(zz2)).redSub(t1);
    t2 = t2.redSub(y1.redMul(zzz2));
    const z3 = z1.redMul(t1);
    let t4 = t1.redSqr();
    t1 = t1.redMul(t4);
    t4 = t4.redMul(x1);
    let x3 = t2.redSqr();
    x3 = x3.redAdd(t1);
    let y3 = t1.redMul(y1);
    t1 = t4.redAdd(t4);
    x3 = x3.redSub(t1);
    t4 = x3.redSub(t4);
    t4 = t4.redMul(t2);
    y3 = t4.redSub(y3);
    return {
        x: x3,
        y: y3,
        z: z3,
    };
};

bn128.zFactors = ({ x2 }, { x1, z1 }) => {
    let t1 = z1.toRed(pRed).redSqr();
    t1 = x1.toRed(pRed).redSub(t1.redMul(x2.toRed(pRed)));
    const zz = t1.redSqr();
    return {
        zz: zz.fromRed(),
        zzz: zz.redMul(t1).fromRed(),
    };
};

bn128.isEqual = function isEqual(x1, y1, z1, x2, y2, z2) {
    const z1Red = z1.toRed(pRed);
    const z2Red = z2.toRed(pRed);
    const zz1 = z1Red.redSqr();
    const zzz1 = zz1.redMul(z1Red);
    const zz2 = z2Red.redSqr();
    const zzz2 = zz2.redMul(z2Red);

    return (
        x1.toRed(pRed).redMul(zz2).fromRed().eq(x2.toRed(pRed).redMul(zz1).fromRed())
        && y1.toRed(pRed).redMul(zzz2).fromRed().eq(y2.toRed(pRed).redMul(zzz1).fromRed())
    );
};

bn128.double = (x, y, z) => {
    const xRed = x.toRed(pRed);
    const yRed = y.toRed(pRed);
    const zRed = z.toRed(pRed);
    const result = bn128._double({ x: xRed, y: yRed, z: zRed });
    return {
        x: result.x.fromRed(),
        y: result.y.fromRed(),
        z: result.z.fromRed(),
    };
};

bn128.mixedAdd = (x2, y2, x1, y1, z1) => {
    const x2Red = x2.toRed(pRed);
    const y2Red = y2.toRed(pRed);
    const x1Red = x1.toRed(pRed);
    const y1Red = y1.toRed(pRed);
    const z1Red = z1.toRed(pRed);

    const result = bn128._mixedAdd({ x2: x2Red, y2: y2Red }, { x1: x1Red, y1: y1Red, z1: z1Red });
    return {
        x: result.x.fromRed(),
        y: result.y.fromRed(),
        z: result.z.fromRed(),
    };
};

bn128.randomPointInternal = () => {
    let x;
    let y;
    function recurse() {
        x = new BN(crypto.randomBytes(32), 16);
        x = x.toRed(pRed);
        const xxx = x.redSqr().redMul(x);
        const y2 = xxx.redAdd(b);
        y = y2.redSqrt();
        if (y.redSqr().fromRed().eq(xxx.redAdd(b).fromRed())) {
            return { x, y };
        }
        return recurse();
    }
    return recurse();
};

bn128.randomPoint = () => {
    const { x, y } = bn128.randomPointInternal();
    return { x: x.fromRed(), y: y.fromRed() };
};

bn128.randomScalar = () => {
    return new BN(crypto.randomBytes(32), 16).umod(n);
};

bn128.randomFieldElement = () => {
    return new BN(crypto.randomBytes(32), 16).umod(p);
};

bn128.randomPointJacobian = () => {
    let { x, y } = bn128.randomPointInternal();
    let z = new BN(crypto.randomBytes(32), 16);
    z = z.toRed(pRed);
    const zz = z.redSqr();
    x = x.redMul(zz);
    y = y.redMul(zz).redMul(z);
    return {
        x: x.fromRed(),
        y: y.fromRed(),
        z: z.fromRed(),
    };
};


bn128.scalarMul = (point, scalar) => {
    const x = point.x.toRed(pRed);
    const y = point.y.toRed(pRed);
    const z = new BN(1).toRed(pRed);

    // check point is on curve
    const xx = x.redSqr();
    const rhs = b.add(xx.redMul(x));
    const lhs = y.redSqr();
    if (!rhs.fromRed().eq(lhs.fromRed())) {
        throw new Error(`${x.toString(16)} : ${y.toString(16)} is not on curve`);
    }

    let accumulator = {
        x,
        y,
        z,
        infinity: false,
    };
    let init = false;
    // iterate in reverse over every bit in <scalar>. If the bit is high, add <point> to the accumulator.
    // For each iteration, double the accumulator (once we have found a high bit)
    // e.g. P^{15}. 11 = 1011 in binary. For first iteration, we have a high bit so set accumulator = P.
    // For every subsequent iteration we will be doubling the accumulator, eventually this will become P^{8}.
    // The third and fourth iteration will also add P to the accumulator, creating P^{8} + P^{3} + P = P^{11}.
    for (let i = 255; i > -1; i -= 1) {
        if (init) {
            accumulator = bn128._double(accumulator);
        }
        if (scalar.testn(i)) {
            if (!init) {
                init = true;
            } else {
                accumulator = bn128._mixedAdd(
                    {
                        x2: x,
                        y2: y,
                    },
                    {
                        x1: accumulator.x,
                        y1: accumulator.y,
                        z1: accumulator.z,
                    }
                );
            }
        }
    }
    return accumulator;
};


bn128.generateSingleTable = (x, y, z) => {
    const point = setRed({ x, y, z });
    const double = bn128._double(point);
    const d = { x: double.x, y: double.y };
    let tableZ = double.z;
    const tableZZ = tableZ.redSqr();
    const tableZZZ = tableZZ.redMul(tableZ);
    const table = [];
    const zFactors = [];
    let prev = { x: point.x.redMul(tableZZ), y: point.y.redMul(tableZZZ), z: point.z };
    table.push({ x: prev.x, y: prev.y, z: point.z });
    for (let i = 1; i < 8; i += 1) {
        const zz = prev.z.redSqr();
        const dz = prev.x.redSub(zz.redMul(d.x));
        prev = bn128._mixedAdd({ x2: d.x, y2: d.y }, { x1: prev.x, y1: prev.y, z1: prev.z });
        table.push(prev);
        zFactors.push(dz);
    }
    tableZ = prev.z.redMul(double.z);
    return {
        table,
        zFactors,
        tableZ,
        doubleZ: double.z,
    };
};

bn128.rescale = (point, zIn) => {
    const { x, y } = setRed(point);
    const z = zIn.red ? zIn : zIn.toRed(pRed);
    const zz = z.redSqr();
    const zzz = zz.redMul(z);
    return {
        x: x.redMul(zz),
        y: y.redMul(zzz),
        z,
    };
};

bn128.generateTable = (inputPoints) => {
    const points = inputPoints.map(i => setRed(i));
    let globalZ = new BN(1).toRed(pRed);
    const tables = points.map((point) => {
        const scaled = bn128.rescale(point, globalZ);
        const table = bn128.generateSingleTable(scaled.x, scaled.y, scaled.z);
        globalZ = table.tableZ;
        return table;
    });
    globalZ = (tables[tables.length - 1].tableZ);
    return { tables, globalZ };
};

bn128.rescaleMultiTable = (tables, globalZ) => {
    let runningZ = new BN(1).toRed(pRed);
    const normalized = [];
    for (let i = tables.length - 1; i >= 0; i -= 1) {
        const { table, zFactors, doubleZ } = tables[i];
        const scaled = [];
        let j = table.length - 1;
        while (j >= 0) {
            const scaledPoint = bn128.rescale(table[j], runningZ);
            scaled[j] = { ...scaledPoint, z: globalZ };
            if (j !== 0) {
                runningZ = runningZ.redMul(zFactors[j - 1]);
            }
            j -= 1;
        }
        runningZ = runningZ.redMul(doubleZ);
        normalized[i] = scaled;
    }
    return normalized;
};

bn128.toAffine = (input) => {
    const point = setRed(input);
    const zz = point.z.redSqr();
    const zzz = zz.redMul(point.z);
    const x = point.x.redMul(zz.redInvm());
    const y = point.y.redMul(zzz.redInvm());
    return { x, y };
};


module.exports = bn128;
