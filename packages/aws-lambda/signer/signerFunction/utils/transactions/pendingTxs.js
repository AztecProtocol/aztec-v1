const {
    types: { Transactions },
} = require('../../database/models');
const { TRANSACTION_STATUS, TRANSACTION_TYPE } = require('../../config/constants');

module.exports = async ({ dappId }) => {
    return Transactions.findAll({
        attributes: ['signatureHash'],
        where: {
            dappId,
            status: TRANSACTION_STATUS.PENDING,
            type: TRANSACTION_TYPE.SPENDING,
        },
    });
};
