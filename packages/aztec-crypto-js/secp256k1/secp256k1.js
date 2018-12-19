const BN = require('bn.js');
const crypto = require('crypto');
const elliptic = require('elliptic');
const web3Utils = require('web3-utils');

function Secp256k1() {
    const curve = new elliptic.ec("secp256k1"); // eslint-disable-line

    curve.accountFromPrivateKey = function accountFromPrivateKey(privateKey) {
        const ecKey = curve.keyFromPrivate(privateKey.slice(2), 'hex');
        const publicKey = `0x${ecKey.getPublic(false, 'hex').slice(2)}`; // remove elliptic.js encoding byte
        const publicHash = web3Utils.sha3(publicKey);
        const address = web3Utils.toChecksumAddress(`0x${publicHash.slice(-40)}`);
        return {
            privateKey,
            publicKey: `0x${ecKey.getPublic(false, 'hex')}`,
            address,
        };
    };

    curve.generateAccount = function generateAccount() {
        return curve.accountFromPrivateKey(`0x${crypto.randomBytes(32).toString('hex')}`);
    };

    /**
     * Get a random point on the curve
     * @method randomPoint
     * @memberof module:secp256k1
     * @returns {Point} a random point
     */
    curve.randomPoint = function randomPoint() {
        function recurse() {
            const x = new BN(crypto.randomBytes(32), 16).toRed(curve.curve.red);
            const y2 = x.redSqr().redMul(x).redIAdd(curve.curve.b);
            const y = y2.redSqrt();
            if (y.redSqr(y).redSub(y2).cmp(curve.curve.a)) {
                return recurse();
            }
            return curve.curve.point(x, y);
        }
        return recurse();
    };

    return curve;
}

module.exports = Secp256k1();
