const { constants } = require('@aztec/dev-utils');
const BN = require('bn.js');
const { keccak256, padLeft } = require('web3-utils');

/**
 * @class
 * @classdesc Class to construct keccak256 hashes required by the AZTEC zero-knowledge proofs
 */
class Keccak {
    constructor() {
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
    appendBN(scalar) {
        this.data.push(padLeft(scalar.toString(16), 64));
    }

    /**
     * Append an elliptic.js group element to {@link Keccak#data}
     *
     * @param {Point} point elliptic.js point
     */
    appendPoint(point) {
        this.data.push(padLeft(point.x.fromRed().toString(16), 64));
        this.data.push(padLeft(point.y.fromRed().toString(16), 64));
    }

    /**
     * Compute keccak256 hash of {@link Keccak#data}, set {@link Keccak#data} to resulting hash
     *
     * @name Keccak#keccak
     * @function
     * @param {reductionContext} reductionContext BN.js reduction context for Montgomery modular multiplication
     */
    keccak(reductionContext = null) {
        const paddedData = this.data.map((i) => padLeft(i, 64)).join('');
        this.data = [keccak256(`0x${paddedData}`).slice(2)];
        if (reductionContext) {
            return new BN(this.data[0], 16).toRed(reductionContext);
        }
        return this.data;
    }

    /**
     * Interface for the {@function keccak} with the reduction context set to the constant found in @aztec/dev-utils
     */
    redKeccak() {
        return this.keccak(constants.BN128_GROUP_REDUCTION);
    }
}

module.exports = Keccak;
