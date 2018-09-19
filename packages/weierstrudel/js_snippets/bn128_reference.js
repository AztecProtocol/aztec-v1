const BN = require('bn.js');
const crypto = require('crypto');

const p = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);
const pRed = BN.red(p);

// bn128 weierstrass formula = y^2 = x^3 + 3
const b = new BN('3', 10).toRed(pRed);

const one = new BN('1', 10);

const bn128 = {};

bn128.p = p;

bn128.double = (x, y, z) => {
    let xRed = x.toRed(pRed);
    let yRed = y.toRed(pRed);
    let zRed = z.toRed(pRed);
    let xx = xRed.redSqr();
    let yy = yRed.redSqr();
    let yyyy = yy.redSqr();
    let zz = zRed.redSqr();
    let s = xRed.redAdd(yy).redSqr().redSub(xx).redSub(yyyy);
    s = s.redAdd(s);
    let m = xx.redAdd(xx).redAdd(xx);
    let t = m.redSqr().redSub(s).redSub(s);
    let x3 = t;
    let yyyy8 = yyyy.redAdd(yyyy);
    yyyy8 = yyyy8.redAdd(yyyy8);
    yyyy8 = yyyy8.redAdd(yyyy8);
    let y3 = s.redSub(t).redMul(m).redSub(yyyy8);
    let z3 = yRed.add(zRed).redSqr().redSub(yy).redSub(zz);
    return {
        x: x3.fromRed(),
        y: y3.fromRed(),
        z: z3.fromRed(),
    };
};

bn128.mixedAdd = (x2, y2, x1, y1, z1) => {
    let debug;
    let x2Red = x2.toRed(pRed);
    let y2Red = y2.toRed(pRed);
    let x1Red = x1.toRed(pRed);
    let y1Red = y1.toRed(pRed);
    let z1Red = z1.toRed(pRed);

    let t1 = z1Red.redSqr();
    let t2 = t1.redMul(z1Red);
    t1 = t1.redMul(x2Red);
    t2 = t2.redMul(y2Red);
    t1 = x1Red.redSub(t1);
    t2 = t2.redSub(y1Red);
    let z3 = z1Red.redMul(t1);
    let t4 = t1.redSqr();
    t1 = t1.redMul(t4);
    t4 = t4.redMul(x1Red);
    let x3 = t2.redSqr();
    x3 = x3.redAdd(t1);
    let y3 = t1.redMul(y1Red);
    t1 = t4.redAdd(t4);
    x3 = x3.redSub(t1);
    t4 = x3.redSub(t4);
    debug = t4;
    t4 = t4.redMul(t2);
    y3 = t4.redSub(y3);
    return {
        x: x3.fromRed(),
        y: y3.fromRed(),
        z: z3.fromRed(),
        debug: debug.fromRed(),
    };
};

function randomPointInternal() {
    let x = new BN(crypto.randomBytes(32), 16);
    x = x.toRed(pRed);
    let y2 = x.redSqr().redMul(x).redAdd(b);
    let y = y2.redSqrt(); // well, either value of y is valid so no reason to be picky
    return { x, y };
}

bn128.randomPoint = () => {
    const { x, y } = randomPointInternal();
    return { x: x.fromRed(), y: y.fromRed() };
};

bn128.randomPointJacobian = () => {
    let { x, y } = randomPointInternal();
    let z = new BN(crypto.randomBytes(32), 16);
    z = z.toRed(pRed);
    let zz = z.redSqr();
    x = x.redMul(zz);
    y = y.redMul(zz).redMul(z);
    return {
        x: x.fromRed(),
        y: y.fromRed(),
        z: z.fromRed(),
    };
}
module.exports = bn128;