const { padLeft, sha3 } = require('web3-utils');
const web3EthAbi = require('web3-eth-abi');

function padKeccak256(data) {
    return padLeft(sha3(data).slice(2), 64);
}

/**
 * Module to construct ECDSA messages for structured data,
 * following the [EIP712]{@link https://github.com/ethereum/EIPs/blob/master/EIPS/eip-712.md} standard
 *
 * @module eip712
 */
const eip712 = {};

/**
 * Create 'type' component of a struct
 *
 * @method encodeStruct
 * @param {string} primaryType the top-level type of the struct
 * @param  {{name: string, type: string}} types set of all types encompassed by struct
 * @returns {string} encoded type string
 */
eip712.encodeStruct = function encodeStruct(primaryType, types) {
    return [primaryType]
        .concat(types[primaryType]
            .reduce((acc, { type: typeKey }) => {
                if (types[typeKey] && acc.indexOf(typeKey) === -1) {
                    return [...acc, typeKey];
                }
                return acc;
            }, [])
            .sort((a, b) => a.localeCompare(b)))
        .reduce((acc, key) => `${acc}${key}(${types[key]
            .reduce((iacc, { name, type }) => `${iacc}${type} ${name},`, '').slice(0, -1)})`, '');
};

/**
 * Recursively encode a struct's data into a unique string
 *
 * @method encodeMessageData
 * @param  {{name: string, type: string}} types set of all types encompassed by struct
 * @param {string} primaryType the top-level type of the struct
 * @param {Object} message the struct instance's data
 * @returns {string} encoded message data string
 */
eip712.encodeMessageData = function encodeMessageData(types, primaryType, message) {
    return types[primaryType].reduce((acc, { name, type }) => {
        if (types[type]) {
            return `${acc}${padKeccak256(`0x${encodeMessageData(types, type, message[name])}`)}`;
        }
        if (type === 'string' || type === 'bytes') {
            return `${acc}${padKeccak256(message[name])}`;
        }
        if (type.includes('[')) {
            return `${acc}${padKeccak256(web3EthAbi.encodeParameter(type, message[name]))}`;
        }
        return `${acc}${web3EthAbi.encodeParameters([type], [message[name]]).slice(2)}`;
    }, padKeccak256(eip712.encodeStruct(primaryType, types)));
};

/**
 * Construct ECDSA signature message for structured data
 *
 * @method encodeTypedData
 * @param {Object} typedData the EIP712 struct object
 * @returns {string} encoded message string
 */
eip712.encodeTypedData = function encodeTypeData(typedData) {
    const domainHash = padKeccak256(`0x${eip712.encodeMessageData(typedData.types, 'EIP712Domain', typedData.domain)}`);
    const structHash = padKeccak256(`0x${eip712.encodeMessageData(typedData.types, typedData.primaryType, typedData.message)}`);
    return `0x${padKeccak256(`0x1901${domainHash}${structHash}`)}`;
};

module.exports = eip712;
