// TODO: document this more clearly
const BN = require('bn.js');

// n = the order of the prime field of the group created by the curve (e.g. for g^{a} = P. a is modulo n)
const n = new BN('21888242871839275222246405745257275088548364400416034343698204186575808495617', 10);


const lambda = new BN('b3c4d79d41a917585bfc41088d8daaa78b17ea66b99c90dd', 16);
const basis = [
    {
        a: new BN('89d3256894d213e3', 16),
        b: new BN('-6f4d8248eeb859fc8211bbeb7d4f1128', 16), // 30644e72e131a029b85045b68181585e06ceecda572a2489be32480255cc0e6f need this?
    },
    {
        a: new BN('6f4d8248eeb859fd0be4e1541221250b', 16),
        b: new BN('89d3256894d213e3', 16),
    },
];

const endo = {};
// endomorphism extension. The Babai rounding step requires 508-bit division, which is a pain.
// So instead of calculating (b1.k)/n and (b2.k)/n when splitting scalar k, precompute
// g1 = 2^(256)b1/n and g2 = 2^(256)b2/n .
// When splitting scalar in 'endoSplit', calculate g1.k/2^(256) and g2.k/2^(256) to extract
// c1, c2. o.e. the top-halves of 512-bit multiplications (g1.k) and (g2.k).

// c1 = (b2.k/n)
// c2 = (-b1.k/n)

// p1 = c1.a1
// p2 = c2.a2
// q1 = c1.b1 = (b1.b2.k)/n
// q2 = c2.b2 = (-b1.b2.k)/n

// (b2.k)
const power = (new BN(2)).pow(new BN(256));
// g1 = round(2^(256)b1 / n)
const g1 = basis[0].b.mul(power).div(n);
// g2 = round(2^(256)b2 / n)
const g2 = basis[1].b.mul(power).div(n);

endo.endoSplit = (k) => {
    const v1 = basis[0];
    const v2 = basis[1];

    const c1 = g2.mul(k).div(power); // (new BN(272));
    const c2 = g1.mul(k).div(power); // ushrn(new BN(272));
    // const p1 = c1.mul(v1.a);
    // const p2 = c2.mul(v2.a);
    const q1 = c1.mul(v1.b);
    const q2 = c2.mul(v2.b);

    // Calculate answer
    const k2 = q1.add(q2).neg();
    const k1 = k.add(n.sub(k2.mul(lambda).umod(n))).umod(n);

    return { k1, k2 };
};


/* function endoSplitReference(k) {
    const v1 = basis[0];
    const v2 = basis[1];

    const c1 = v2.b.mul(k).div(n);
    const c2 = v1.b.neg().mul(k).div(n);

    const p1 = c1.mul(v1.a);
    const p2 = c2.mul(v2.a);
    const q1 = c1.mul(v1.b);
    const q2 = c2.mul(v2.b);

    // Calculate answer
    const k1 = k.sub(p1).sub(p2);
    const k2 = q1.add(q2).neg();
    console.log(k1.bitLength());
    console.log(k2.bitLength());

    return { k1, k2 };
} */

module.exports = endo;
