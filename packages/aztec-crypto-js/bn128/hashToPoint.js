// const BN = require('bn.js');

// const bn128 = require('./bn128');

// const hashToPoint = {};

// const beta = new BN('59e26bcea0d48bacd4f263f1acdb5c4f5763473177fffffe', 16).toRed(bn128.red);
// const half = new BN(2).toRed(bn128.red).redInvm();
// const four = new BN(4).toRed(bn128.red);
// const sixteen = new BN(16).toRed(bn128.red);
// const zero = new BN(0).toRed(bn128.red);
// const two = new BN(0).toRed(bn128.red);

// const alpha = [
//     (beta.redSub(new BN(1).toRed(bn128.red))).redMul(half),
//     (new BN(0).toRed(bn128.red).redSub(new BN(1).toRed(bn128.red)).redSub(beta))
//         .redMul(half),
// ];

// function recoverFirst(t) {
//     const tt = t.redSqr();
//     const t0 = four.redAdd(tt);
//     const t1 = beta.redMul(t).redInvm();
//     const y = zero.redSub(t0.redMul(t1));
//     const x = y.redInvm().redAdd(alpha[0]);
//     return (x.redSqr().redMul(x).redAdd(bn128.b).fromRed()
//         .eq(y.redSqr().fromRed()));
// }

// hashToPoint.hashToPoint = () => {
//     // test
//     const point = bn128.randomPoint();
//     const { x/* , y */ } = point;

//     function first() {
//         const v = x;
//         const t0 = beta.redAdd(v).redSub(alpha[0]);
//         const t1 = sixteen.toRed(bn128.red).redMul(v.redSub(alpha[0]));
//         const t2 = (bn128.a.redSub(t0.redSub(t1))).redSqrt();
//         const t3 = t1.redMul(two.toRed(bn128.red)).redInvm();
//         const t = t2.redMul(t3);
//         if (recoverFirst(t)) {
//             return true;
//         }
//         return null;
//     }
//     let count = 0;
//     for (let i = 0; i < 20; i += 1) {
//         if (first()) {
//             count += 1;
//         }
//     }
//     console.log(count);
//     return count;
// };

// hashToPoint.hashToPoint();
// module.exports = hashToPoint;
