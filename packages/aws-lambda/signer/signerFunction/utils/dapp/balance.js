const {
    types: {
        Transactions,
    },
} = require('../../database/models');


module.exports = async ({
    dappId,
}) => {
    return Transactions.sum('value', { where: { dappId } });
};
