const Web3 = require('web3');
const web3Factory = require('../../services/Web3Service/helpers/web3Factory');

const {
    toBN,
    soliditySha3,
} = Web3.utils;

module.exports = async ({
    data,
    accout,
    networkId,
}) => {
    const {
        relayerAddress,
        from,
        encodedFunctionCall,
        txFee,
        gasPrice,
        gas,
        nonce,
        relayHubAddress,
        to,
        maxTimestamp,
    } = data;

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
    )

    const web3Service = web3Factory.getWeb3Service(networkId);

    const {
        dataHash,
        signature,
    } = await web3Service.signData(solSha3Data, accout);

    return {
        signature,
        dataHash,
        data,
    };
};
