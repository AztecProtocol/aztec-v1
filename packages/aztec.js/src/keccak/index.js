const BN = require('bn.js');
const { keccak256, padLeft } = require('web3-utils');

const hashStrings = (inputArr) => {
    const input = `${inputArr
        .map((i) => {
            const res = padLeft(i, 64);
            return res;
        })
        .join('')}`;
    return keccak256(`0x${input}`).slice(2);
};

/**
 *
 * @class
 * @classdesc Class to construct keccak256 hashes required by the AZTEC zero-knowledge proof,
 */
function Keccak() {
    /**
     * array of data being hashed. Each element is a 32-bytes long hex-formatted string
     * @member {string[]}
     */
    this.data = [];
}

/**
 * Append an elliptic.js group element to {@link Keccak#data}
 *
 * @name Keccak#append
 * @function
 * @param {Point} point elliptic.js point
 */
Keccak.prototype.append = function append(point) {
    this.data.push(padLeft(point.x.fromRed().toString(16), 64));
    this.data.push(padLeft(point.y.fromRed().toString(16), 64));
};

/**
 * Append a BN.js instance {@link Keccak#data}
 *
 * @name Keccak#appendBN
 * @function
 * @param {scalar} scalar BN.js number
 */
Keccak.prototype.appendBN = function append(scalar) {
    this.data.push(padLeft(scalar.toString(16), 64));
};

/**
 * Compute keccak256 hash of {@link Keccak#data}, set {@link Keccak#data} to resulting hash
 *
 * @name Keccak#appendBN
 * @function
 * @param {scalar} scalar BN.js number
 */
Keccak.prototype.keccak = function keccak(reductionContext = null) {
    const result = hashStrings(this.data);
    this.data = [result];
    if (reductionContext) {
        return new BN(this.data[0], 16).toRed(reductionContext);
    }
    return this.data;
};

module.exports = Keccak;
