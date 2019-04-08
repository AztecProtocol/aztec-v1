const BN = require('bn.js');

const hashToPoint = {};

const p = new BN('21888242871839275222246405745257275088696311157297823662689037894645226208583', 10);
const pRed = BN.red(p);
const b = new BN('3', 10).toRed(pRed);
const zero = new BN('0', 10).toRed(pRed);

hashToPoint.baseString = 'Just Read The Instructions!';
hashToPoint.asciiString = 0x4a75737420526561642054686520496e737472756374696f6e7321;
hashToPoint.asciiStringRLP = 0x00000000004a75737420526561642054686520496e737472756374696f6e7321;
hashToPoint.asciiHash = 0x6f1e57ce61731388001f7e47ffd4312f4cfac1db86e494d68bd9044f1646f592;

hashToPoint.getPoint = (hash) => {
    const xBase = new BN(hash, 16);
    const xRed = xBase.toRed(pRed);
    const xx = xRed.redSqr();
    const xxx = xx.redMul(xRed);
    const yy = xxx.redAdd(b);
    const y = yy.redSqrt();
    if (
        y
            .redSqr()
            .redSub(yy)
            .cmp(zero) !== 0
    ) {
        throw new Error('Cannot find root, pick another hash');
    }
};

// output x = 0xe55bae89f0fd3348f7ef2dafcd180741df7ecb8b600ffbc1397ec21654cfb04
// output y = 0xb11e774e1efc39981995b18fbb59cf3a164507d0ce503e6660205d1f46f85f3
module.exports = hashToPoint;
