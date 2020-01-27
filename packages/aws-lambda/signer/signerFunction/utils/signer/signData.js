const Web3 = require('web3');
const web3Service = require('../../services/Web3Service');

const { toBN, soliditySha3 } = Web3.utils;

module.exports = async (data, accout) => {
    const { relayerAddress, from, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayHubAddress, to, maxTimestamp } = data;

    const solSha3Data = soliditySha3(
        relayerAddress,
        from,
        encodedFunctionCall,
        toBN(txFee),
        toBN(gasPrice),
        toBN(gas),
        toBN(nonce),
        relayHubAddress,
        to,
        maxTimestamp,
    );

    const { dataHash, signature } = await web3Service.signData(solSha3Data, accout);

    return {
        signature,
        dataHash,
        data,
    };
};
