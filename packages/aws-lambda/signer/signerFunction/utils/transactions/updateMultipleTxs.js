const {
    types: { Transactions },
} = require('../../database/models');

module.exports = async ({ transactions }) => {
    return Promise.all(
        transactions.map((tx) => {
            return Transactions.update(tx, {
                where: {
                    signatureHash: tx.signatureHash,
                },
            });
        }),
    );
};
