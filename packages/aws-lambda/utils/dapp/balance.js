const {
    types: { Transactions },
} = require('../../database/models');

module.exports = async ({ dappId }) => {
    const balance = await Transactions.sum('value', { where: { dappId } });

    // eslint-disable-next-line no-restricted-globals
    return isNaN(balance) ? 0 : balance;
};
