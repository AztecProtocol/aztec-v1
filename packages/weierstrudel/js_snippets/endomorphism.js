const BN = require('bn.js')

const crypto = require('crypto');
// p = the order of the prime field that the curve is defined over (e.g. for y^{2} = x^{3} + 3, x and y are modulo p)
const p = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);
// n = the order of the prime field of the group created by the curve (e.g. for g^{a} = P. a is modulo n)
const n = new BN('21888242871839275222246405745257275088548364400416034343698204186575808495617', 10);
const fieldReduction = BN.red(p);

// g1 is the 'generator' point of the bn128 curve.
const g = { x: new BN(1), y: new BN(2), z: new BN(1) };



// Calculate endomorphism scalars, from Intudny's elliptic.js library.
const endo = {};
const beta = new BN('1e37a68a14ddd1f28e9f6452322e6f2c22a573dc45aa1e7dcf6917dda1583b6e', 16);
const lambda = new BN('b3c4d79d41a917585bfc41088d8daaa78b17ea66b99c90dd', 16);
const basis = [
    {
        a: new BN('89d3256894d213e3', 16),
        b: new BN('-6f4d8248eeb859fc8211bbeb7d4f1128', 16), // 30644e72e131a029b85045b68181585e06ceecda572a2489be32480255cc0e6f need this?
    },
    {
        a: new BN('6f4d8248eeb859fd0be4e1541221250b', 16),
        b: new BN('89d3256894d213e3', 16),
    }
]

// endomorphism extension. The Babai rounding step requires 512-bit division, which is a pain.
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

console.log('b1 = ', basis[0].b);
console.log('b2 = ', basis[1].b);
console.log('g1 = ', g1.toString(16));
console.log('g2 = ', g2.toString(16));

console.log('actual shifted b1 = ', basis[0].b.mul(power).div(n));

console.log('b1 mod n = ',n.add(basis[0].b).toString(16));
endo.endoSplit = (k) => {
    var v1 = basis[0];
    var v2 = basis[1];
  
    // var c1 = v2.b.mul(k).div(n);
    // var c2 = v1.b.neg().mul(k).div(n);
    var c1 = g2.mul(k).div(power); // (new BN(272));
    var c2 = g1.mul(k).div(power); // ushrn(new BN(272));
    var p1 = c1.mul(v1.a);
    var p2 = c2.mul(v2.a);
    var q1 = c1.mul(v1.b);
    var q2 = c2.mul(v2.b);
    console.log('c1 = ', c1.toString(16));
    console.log('c2 = ', c2.toString(16));

    console.log('q1 = ', q1.toString(16));
    console.log('q2 = ', q2.toString(16));
    // Calculate answer
    // var k1 = k.sub(p1).sub(p2);
    var k2 = q1.add(q2).neg();
    var k1 = k.add(n.sub(k2.mul(lambda).umod(n))).umod(n);
    // const test = k1.add(k2.mul(lambda).umod(n)).umod(n);
    // console.log(k);
    // console.log(test);
    console.log(k1.bitLength());
    console.log(k2.bitLength());

    return { k1: k1, k2: k2 };
};


function _endoSplitReference(k) {
    var v1 = basis[0];
    var v2 = basis[1];
  
    var c1 = v2.b.mul(k).div(n);
    var c2 = v1.b.neg().mul(k).div(n);
  
    var p1 = c1.mul(v1.a);
    var p2 = c2.mul(v2.a);
    var q1 = c1.mul(v1.b);
    var q2 = c2.mul(v2.b);
  
    // Calculate answer
    var k1 = k.sub(p1).sub(p2);
    var k2 = q1.add(q2).neg();
    console.log(k1.bitLength());
    console.log(k2.bitLength());

    return { k1: k1, k2: k2 };
};

module.exports = endo;

let k = new BN(crypto.randomBytes(32), 16).umod(n);

console.log('k = ', k.toString(10));
console.log(endo.endoSplit(k));



const a1 = basis[0].a;
const b1 = basis[0].b;
const a2 = basis[1].a;
const b2 = basis[1].b;

// const c2n = b1.neg().mul(k);
// const c1n = b2.mul(k);

// const p1 = a1.mul(c1n);
// const p2 = a2.mul(c2n);
// const sum = p1.add(p2);
// const kn = k.mul(n);
function testRef() {
    const c1 = b2.mul(k).divRound(n);
    const p1 = c1.mul(a1);
    
    const c2 = b1.neg().mul(k).divRound(n);
    const p2 = c2.mul(a2);
    
    const k1 = k.sub(p1).sub(p2);
    
    console.log('k2 = ', k1);
}

function testRef2() {

    const g1 = b2.shln(256).divRound(n);
    const g2 = b1.neg().shln(256).divRound(n);

    console.log('g1 = ', g1);
    console.log('g2 = ', g2);
    const c1 = g1.mul(k).shrn(256);
    const c2 = g2.mul(k).shrn(256);
    console.log(c1.bitLength());
    console.log(c2.bitLength());
    const q1 = c1.mul(b1); // .umod(n);
    const q2 = c2.mul(b2); // .umod(n);
    console.log('c1 = ', c1);
    console.log('c2 = ', c2);
    console.log('q1 = ', q1);
    console.log('q2 = ', q2);
    console.log('qq1 = ', qq1);
    console.log('qq2 = ', qq2);
    const k1 = q1.add(q2).neg();
    const k2 = k.sub(lambda.mul(k1)).umod(n);
    console.log('k1 = ', k1);
    console.log('k2 = ', k2);

    // var v1 = basis[0];
    // var v2 = basis[1];
  
    // var c1 = v2.b.mul(k).div(n);
    // var c2 = v1.b.neg().mul(k).div(n);
  
    // var p1 = c1.mul(v1.a);
    // var p2 = c2.mul(v2.a);
    // var q1 = c1.mul(v1.b);
    // var q2 = c2.mul(v2.b);
  
    // // Calculate answer
    // var k1 = k.sub(p1).sub(p2);
    // var k2 = q1.add(q2).neg();
}
testRef();
testRef2();
// console.log('sum = ', sum.toString(16));
// console.log('kn = ', kn.toString(16));
// console.log('a2 = ', a2);
// console.log('comp = ', a1.sub(b1));

// const tempin = a1.neg().add(a2.neg());
// const asquare = tempin.sqr();
// console.log('asquarething = ', asquare.toString(16));
// console.log('n = ', n.toString(16));

// const a1b2 = a1.mul(b2).umod(n);
// const a2b1 = a2.mul(b1).umod(n);
// console.log('a1b2 = ', a1b2.toString(16));
// console.log('a2b1 = ', a2b1.toString(16));
// const res = a1b2.add(a2b1.neg());
// console.log('res = ', res.toString(16));
// console.log('a1 square = ', a1.sqr());
// console.log('b1 square = ', b1.sqr());
// console.log('a2 square = ', a2.sqr());
// console.log('b2 square = ', b2.sqr());

// const a1b1lambda = a1.add(b1.mul(lambda));
// const a2b2lambda = a2.add(b2.mul(lambda));

// console.log('first = ', a1b1lambda.toString(16));
// console.log('second = ', a2b2lambda.toString(16));

// const lambda2 = lambda.mul(lambda).umod(n);
// const lambda3 = lambda2.mul(lambda).umod(n);

// console.log('lambda = ', lambda.toString(16));
// console.log('lambda2 = ', lambda2.toString(16));
// console.log('lambda3 = ', lambda3.toString(16));

// console.log(lambda.sub(lambda2).add(new BN(1)).umod(n));