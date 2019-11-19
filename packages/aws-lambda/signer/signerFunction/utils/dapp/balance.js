const {
    Transaction,
} = require('../../database/models');


module.exports = async ({
    dappId,
}) => {
    return Transaction.sum('value', { where: { dappId } });
};
