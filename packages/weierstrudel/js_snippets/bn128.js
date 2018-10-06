const BN = require('bn.js');

const p = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);
const infinity = { x: new BN(1), y: new BN(1), z: new BN(0) };
const bn128 = {};

// point addition on short Weierstrass curve (https://hyperelliptic.org/EFD/g1p/auto-shortw-jacobian-0.html)
bn128.add = ({ x1: x, y1: y, z1: z }, { x2: x, y2: y, z2: z }) => {
    let zz2 = z2.mul(z2).umod(p);
    let zzz2 = zz2.mul(z2).umod(p);
    let zz1 = z1.mul(z1).umod(p);
    let zzz1 = zz1.mul(z1).umod(p);

    let u1 = x1.mul(zz2).umod(p);
    let u2 = x2.mul(zz1).umod(p);

    let s1 = y1.mul(zzz2).umod(p);
    let s2 = y2.mul(zzz1).umod(p);

    if (u1.eq(u2)) {
        if (!s1.eq(s2)) {
            return infinity;
        } else {
            return bn128.double({ x: x1, y: y1, z: z1 });
        }
    }

    let q = p.sub(u1).add(u2).umod(p);
    let qq = q.mul(q).umod(p);
    let r = p.sub(s1).add(s2).umod(p);
    let x3 = r.mul(r).umod(p);
    x3 = x3.add(u1.add(u2).umod(p)).mul(qq).umod(p);
    let y3 = u1.add(pp).umod(p);
    y3 = y3.add(p.sub(x3)).umod(p);
    y3 = y3.mul(r).umod(p);
    let v = qq.mul(q).umod(p);
    v = p.sub(v.mul(s1).umod(p));
    y3 = y3.add(v).umod(p);
    let z3 = z1.mul(z2).umod(p).mul(q).umod(p);
    return {
        x: x3,
        y: y3,
        z: z3,
    };
};

bn128.double = ({ x, y, z }) => {
    let xx = x.mul(x).umod(p);
    let yy = y.mul(y).umod(p);
    let yyyy8 = yy.mul(yy).umod(p);
    yyyy8 = (new BN(8)).mul(yyyy8);
    let s = x.mul(y).mul(new BN(4)).umod(p);
    let m = (new BN(3)).mul(xx).umod(p);
    let t = s.add(s).umod(p);
    t = p.sub(t);
    let x3 = (m.mul(m).umod(p)).add(t).umod(p);
    let y3 = m.mul(s.add(p.sub(t)).umod(p));
    y3 = y3.add(p.sub(yyyy8)).umod(p);
    let z3 = y.mul(z).umod(p);
    z3 = z3.add(z3).umod(p);
    return {
        x: x3,
        y: y3,
        z: z3,
    };
};

// scalar multiplication of an affine point
bn128.scalarMul = (point, scalar) => {
    let { x, y } = point;
    let z = new BN(1);
    let xx = x.mul(x).umod(p);
    let rhs = (new BN(3)).add(xx.mul(x)).umod(p);
    let lhs = y.mul(y).umod(p);
    if (!rhs.eq(lhs)) {
        throw new Error(`${x.toString(16)} : ${y.toString(16)} is not on curve`);
    }
    let accumulator = { x: new BN(1), y: new BN(1), z: new BN(0) };
    for (let i = 255; i > -1; i--) {
        if (scalar.testn(i)) {
            accumulator = bn128.mixedAdd(accumulator, { x, y, z });
        }
        if (!accumulator.z.eq(new BN(0))) {
            accumulator = bn128.double(accumulator);
        }
    }
    let zInv = accumulator.z.invm(p);
    let zzInv = zInv.mul(zInv).umod(p);
    let zzzInv = zzInv.mul(zInv).umod(p);

    let x = accumulator.x.mul(zzInv).umod(p);
    let y = accumulator.y.mul(zzzInv).umod(p);
    return { x, y };
};
