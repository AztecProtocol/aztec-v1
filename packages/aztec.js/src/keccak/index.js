const { constants } = require('@aztec/dev-utils');
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
 * Append an elliptic.js group element to {@link Keccak#data}
 *
 * @name Keccak#append
 * @function
 * @param {Point} point elliptic.js point
 */
Keccak.prototype.appendPoint = function appendPoint(point) {
    this.data.push(padLeft(point.x.fromRed().toString(16), 64));
    this.data.push(padLeft(point.y.fromRed().toString(16), 64));
};

/**
 * Compute keccak256 hash of {@link Keccak#data}, set {@link Keccak#data} to resulting hash
 *
 * @name Keccak#keccak
 * @function
 * @param {reductionContext} reductionContext BN.js reduction context for Montgomery modular multiplication
 */
Keccak.prototype.keccak = function keccak(reductionContext = null) {
    const result = hashStrings(this.data);
    this.data = [result];
    if (reductionContext) {
        return new BN(this.data[0], 16).toRed(reductionContext);
    }
    return this.data;
};

/**
 * Interface for the {@function keccak} with the reduction context set to the constant found in @aztec/dev-utils
 */
Keccak.prototype.redKeccak = function redKeccak() {
    return this.keccak(constants.BN128_GROUP_REDUCTION);
}

module.exports = Keccak;
