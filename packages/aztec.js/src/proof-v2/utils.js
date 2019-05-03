const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const crypto = require('crypto');
const { isHexStrict, padLeft } = require('web3-utils');

const bn128 = require('../bn128');

class ProofUtils {
    /**
     * Calculate kPublic based on the values of the input notes and output notes
     * @param {number[]} kIn array of input note values
     * @param {number[]} kOut array of output note values
     * @returns {number} net value of the input notes and output notes
     */
    static getKPublic(kIn, kOut) {
        return kOut.reduce((acc, value) => acc - value, kIn.reduce((acc, value) => acc + value, 0));
    }

    /**
     * Validates if the given string is an Ethereum address
     * @param {address} string to verify
     * @returns {bool} true if the string is an Ethereum address
     */
    static isEthereumAddress(address) {
        return address && address.length === 42 && isHexStrict(address);
    }

    /**
     * Validate proof inputs are well formed
     * @method isOnCurve
     * @param {BN[]} point bn.js format of a point on the curve
     * @returns {boolean} true if point is on curve, false if not
     */
    static isOnCurve(point) {
        const lhs = point.y.redSqr();
        const rhs = point.x
            .redSqr()
            .redMul(point.x)
            .redAdd(bn128.curve.b);
        return lhs.fromRed().eq(rhs.fromRed());
    }

    /**
     * Generate a random Ethereum address
     * @method randomAddress
     * @returns {string} - the random Ethereum address
     */
    static randomAddress() {
        return `0x${padLeft(crypto.randomBytes(20).toString('hex'))}`;
    }

    /**
     * Generate a random note value that is less than K_MAX
     * @method randomNoteValue
     * @returns {BN} - big number instance of an AZTEC note value
     */
    static randomNoteValue() {
        return new BN(crypto.randomBytes(32), 16).umod(new BN(constants.K_MAX)).toNumber();
    }
}

module.exports = { ProofUtils };
