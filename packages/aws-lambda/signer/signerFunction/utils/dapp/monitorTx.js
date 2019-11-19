const {
    Transaction,
} = require('../../database/models');
const calculateTransactionId = require('../../services/DBClient/helpers/calculateTransactionId');
const {
    TRANSACTION_STATUS,
    TRANSACTION_TYPE,
} = require('../../config/constants');


module.exports = async ({
    dappId,
    signature,
    from,
}) => {
    const signatureHash = calculateTransactionId(signature);
    const status = TRANSACTION_STATUS.PENDING;
    const type = TRANSACTION_TYPE.SPENDING;
    const value = -1;

    const tx = await Transaction.create({
        signatureHash,
        dappId,
        from,
        status,
        type,
        value,
    });

    return tx;
};