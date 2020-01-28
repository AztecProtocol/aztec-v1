const web3Service = require('../../services/Web3Service');
const signData = require('./signData');
const { TIME_TO_SEND_GSN_TRANSACTION } = require('../../config/constants');

module.exports = async (data, accout) => {
    const { timestamp } = await web3Service.latestBlock();
    const maxTimestamp = timestamp + TIME_TO_SEND_GSN_TRANSACTION;

    const { signature, data: signedData } = await signData(
        {
            ...data,
            maxTimestamp,
        },
        accout,
    );

    const approvalData = web3Service.encodeParameters(['uint256', 'bytes'], [maxTimestamp, signature]);

    return {
        signature,
        signedData,
        approvalData,
    };
};
