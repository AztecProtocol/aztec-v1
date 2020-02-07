const Sequelize = require('sequelize');
const connection = require('../helpers/connection');
const { Dapps, Transactions } = require('./types');
const { TRANSACTION_TYPE, TRANSACTION_STATUS, SHA3_LENGTH, ETH_ADDRESS_LENGTH } = require('../../config/constants');

const {
    STRING,
    INTEGER,
    ENUM,
    Deferrable: { INITIALLY_IMMEDIATE },
} = Sequelize;

module.exports = () => {
    Transactions.init(
        {
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
                    model: Dapps,
                    key: 'id',
                    deferrable: INITIALLY_IMMEDIATE,
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
                values: [TRANSACTION_TYPE.SPENDING, TRANSACTION_TYPE.PURCHASE, TRANSACTION_TYPE.REFUND],
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
        },
        {
            sequelize: connection.getConnection(),
            modelName: 'Transactions',
            timestamps: true,
        },
    );
};
