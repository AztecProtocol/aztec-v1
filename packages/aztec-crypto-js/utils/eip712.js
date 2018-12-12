const web3Utils = require('web3-utils');
const web3EthAbi = require('web3-eth-abi');

const eip712 = {};

eip712.encodeTypedData = function encodeTypedData(typedData) {
    const {
        types,
        primaryType,
        domain,
        message,
    } = typedData;

    const { EIP712Domain, ...rest } = types;
    const params = rest || {};
    const structHash = eip712.hashStruct(primaryType, params, message).slice(2);
    const domainHash = eip712.hashStruct('EIP712Domain', { EIP712Domain }, domain).slice(2);
    const result = web3Utils.sha3(`0x1901${domainHash}${structHash}`, 'hex');
    return result;
};

eip712.hashStruct = function hashStruct(primaryType, types, message) {
    const typeString = eip712.encodeStruct(primaryType, types);

    // Note to self, why on Earth was I slicing 2 chars off this string? It's not hex!
    // TODO: figure out what to do about this, our deployed contracts use an incorrect type hash...
    const typeHash = web3Utils.sha3(web3EthAbi.encodeParameters(['string'], [typeString.slice(2)]), 'hex');
    const encodedData = eip712.encodeMessageData(message, types, types[primaryType]);
    const hashedStruct = web3Utils.sha3(`${typeHash}${encodedData.slice(2)}`, 'hex');

    return hashedStruct;
};

eip712.encodeStruct = function encodeStruct(primaryType, types) {
    const typeKeys = [primaryType, ...Object.keys(types).filter(key => key !== primaryType).sort((a, b) => a.localeCompare(b))];
    // eslint-disable-next-line max-len
    return typeKeys.reduce((acc, typeKey) => `${acc}${typeKey}(${types[typeKey].reduce((typeAcc, { name, type }) => `${typeAcc}${name} ${type},`, '').slice(0, -1)})`, '');
};


eip712.encodeMessageData = function encodeMessageData(message, types, topLevel = {}) {
    function recurse(_message, _topLevel = {}) {
        const messageKeys = Object.keys(_message);
        const topLevelTypes = _topLevel.reduce((acc, { name, type }) => ({ ...acc, [name]: { name, type } }), {});
        return messageKeys.reduce((acc, messageKey) => {
            const { type } = topLevelTypes[messageKey];
            if (types[type]) {
                const newMessage = _message[messageKey];
                return `${acc}${recurse(newMessage, types[type])}`;
            }
            if (type === 'string' || type === 'bytes' || type.includes('[')) {
                const data = web3EthAbi.encodeParameters([type], [_message[messageKey]]);
                const hash = web3Utils.sha3(data, 'hex');
                return `${acc}${hash.slice(2)}`;
            }
            return `${acc}${web3EthAbi.encodeParameters([type], [_message[messageKey]]).slice(2)}`;
        }, '');
    }
    const result = `0x${recurse(message, topLevel)}`;
    return result;
};

module.exports = eip712;
