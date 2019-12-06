const web3Factory = require('../../services/Web3Service/helpers/web3Factory');
const signData = require('./signData');
const {
    TIME_TO_SEND_GSN_TRANSACTION,
} = require('../../config/constants');


module.exports = async ({
    data,
    accout,
    networkId,
}) => {
    const web3Service = web3Factory.getWeb3Service(networkId);
    const {
        timestamp,
    } = await web3Service.latestBlock();
    const maxTimestamp = timestamp + TIME_TO_SEND_GSN_TRANSACTION;

    const {
        signature,
        data: signedData,
    } = await signData({
        data: {
            ...data,
            maxTimestamp,
        },
        accout,
        networkId,
    });

    const approvalData = web3Service.encodeParameters(
        ['uint256', 'bytes'],
        [maxTimestamp, signature],
    );

    return {
        signature,
        signedData,
        approvalData,
    };
};
