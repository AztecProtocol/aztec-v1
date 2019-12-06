const {
    TRANSACTION_TYPE,
    TRANSACTION_STATUS,
    SHA3_LENGTH,
    ETH_ADDRESS_LENGTH,
} = require('../../config/constants');


module.exports = (sequelize, DataTypes) => {
    const {
        STRING,
        INTEGER,
        ENUM,
    } = DataTypes;

    const Transactions = sequelize.define('Transactions', {
        signatureHash: {
            type: STRING(SHA3_LENGTH),
            allowNull: true,
        },
        from: {
            type: STRING(ETH_ADDRESS_LENGTH),
            allowNull: true,
        },
        dappId: {
            type: INTEGER,
            allowNull: false,
            references: {
                model: 'Dapps',
                key: 'id',
            },
        },
        value: {
            type: INTEGER,
            allowNull: false,
        },
        actualCharge: {
            type: INTEGER,
            allowNull: true,
        },
        type: {
            type: ENUM,
            allowNull: false,
            values: [
                TRANSACTION_TYPE.SPENDING,
                TRANSACTION_TYPE.PURCHASE,
                TRANSACTION_TYPE.REFUND,
            ],
        },
        status: {
            type: ENUM,
            allowNull: false,
            values: [
                TRANSACTION_STATUS.PENDING,
                TRANSACTION_STATUS.OK,
                TRANSACTION_STATUS.FAILED,
                TRANSACTION_STATUS.EXPIRED,
            ],
        },
        nonce: {
            type: INTEGER,
            allowNull: false,
        },
    }, {})
    Transactions.associate = function (models) {
      // associations can be defined here
    }
    return Transactions
};
