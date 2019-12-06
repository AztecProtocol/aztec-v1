const {
    dbFactory,
} = require('../../database');


module.exports = async ({
    transactions,
    networkId,
}) => {
    const {
        Transactions,
    } = dbFactory.getDB(networkId);

    return Promise.all(transactions.map(tx => {
        return Transactions.update(tx, {
            where: {
                signatureHash: tx.signatureHash,
            },
        });
    }))
};
