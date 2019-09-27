export const abi = web3 => ({
    encodeEventSignature: event => web3.eth.abi.encodeEventSignature(event),
    encodeParameter: (type, value) => web3.eth.abi.encodeParameter(type, value),
    decodeLog: (inputs, hexString, topics) => web3.eth.abi.decodeLog(inputs, hexString, topics),
});
