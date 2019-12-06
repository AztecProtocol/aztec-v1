const {
    dbFactory,
} = require('../../database');
const {
    TRANSACTION_STATUS,
    TRANSACTION_TYPE,
} = require('../../config/constants');


module.exports = async ({
    dappId,
    networkId,
}) => {
    const {
        Transactions,
    } = dbFactory.getDB(networkId);
    return Transactions.findAll({
        attributes: ['signatureHash'],
        where: {
            dappId,
            status: TRANSACTION_STATUS.PENDING,
            type: TRANSACTION_TYPE.SPENDING,
        },
    });
};
