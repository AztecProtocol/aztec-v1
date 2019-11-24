const Sequelize = require('sequelize');
const {
    types: {
        Transactions,
    },
} = require('../../database/models');

const {
    Op,
} = Sequelize;


module.exports = async ({
    status,
    signaturesHashes,
}) => {
    await Transactions.update({
        status,
    }, {
        where: {
            signatureHash: {
                [Op.in]: signaturesHashes,
            },
        },
    });
};
