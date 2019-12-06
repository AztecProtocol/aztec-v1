const Sequelize = require('sequelize');
const {
    dbFactory,
} = require('../../database');
const {
    TRANSACTION_STATUS,
} = require('../../config/constants');

const {
    Op,
} = Sequelize;


module.exports = async ({
    networkId,
}) => {
    const {
        Transactions,
    } = dbFactory.getDB(networkId);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    return Transactions.update({
        status: TRANSACTION_STATUS.EXPIRED,
    }, {
        where: {
            status: TRANSACTION_STATUS.PENDING,
            updatedAt: {
                [Op.lt]: yesterday,
            },
        },
    });
};
