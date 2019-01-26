// TODO: document this more clearly
const BN = require('bn.js');

// n = the order of the prime field of the group created by the curve (e.g. for g^{a} = P. a is modulo n)

const endo = {};

endo.n = new BN('21888242871839275222246405745257275088548364400416034343698204186575808495617', 10);
endo.lambda = new BN('b3c4d79d41a917585bfc41088d8daaa78b17ea66b99c90dd', 16);
endo.basis = [
    {
        a: new BN('89d3256894d213e3', 16),
        b: new BN('-6f4d8248eeb859fc8211bbeb7d4f1128', 16), // 30644e72e131a029b85045b68181585e06ceecda572a2489be32480255cc0e6f need this?
    },
    {
        a: new BN('6f4d8248eeb859fd0be4e1541221250b', 16),
        b: new BN('89d3256894d213e3', 16),
    },
];

endo.g1 = new BN('-24ccef014a773d2cf7a7bd9d4391eb18d', 16);
endo.g2 = new BN('2d91d232ec7e0b3d7', 16);

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

// g1 = round(2^(256)b1 / n)
// g2 = round(2^(256)b2 / n)

endo.getShiftedBasis = () => {
    const g1 = endo.basis[0].b.ushln(256).div(endo.n);
    const g2 = endo.basis[1].b.ushln(256).div(endo.n);
    return { g1, g2 };
};

endo.endoSplit = (k) => {
    const v1 = endo.basis[0];
    const v2 = endo.basis[1];

    const c1 = endo.g2.mul(k).ushrn(256);
    const c2 = endo.g1.mul(k).ushrn(256);

    const q1 = c1.mul(v1.b);
    const q2 = c2.mul(v2.b);

    // Calculate answer
    const k2 = q2.sub(q1);
    const k2Lambda = k2.mul(endo.lambda).umod(endo.n);
    const k1 = k.sub(k2Lambda);
    return { k1, k2: k2.neg() };
    // k = k1 + (-k2*lambda mod n)
};

module.exports = endo;
