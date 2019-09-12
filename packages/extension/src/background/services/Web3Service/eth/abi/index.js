export const abi = (web3) => ({
    encodeEventSignature: (event) => {
        return web3.eth.abi.encodeEventSignature(event);
    },
    encodeParameter: (type, value) => {
        return web3.eth.abi.encodeParameter(type, value);
    },
    decodeLog: (inputs, hexString, topics) => {
        return web3.eth.abi.decodeLog(inputs, hexString, topics)
    },
})