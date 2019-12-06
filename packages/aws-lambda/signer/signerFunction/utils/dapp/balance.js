const {
    dbFactory,
} = require('../../database');


module.exports = async ({
    dappId,
    networkId,
}) => {
    const {
        Transactions,
    } = dbFactory.getDB(networkId);
    const balance = await Transactions.sum('value', { where: { dappId } });

    // eslint-disable-next-line no-restricted-globals
    return isNaN(balance) ? 0 : balance;
};
