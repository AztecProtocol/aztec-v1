const Sequelize = require('sequelize');
const sequelize = require('../helpers/connection');
const {
    Dapp,
    Transaction,
} = require('./types');
const {
    TRANSACTION_TYPE,
    TRANSACTION_STATUS,
    SHA3_LENGTH,
    ETH_ADDRESS_LENGTH,
} = require('../../config/constants');


const {
    STRING,
    BOOLEAN,
    INTEGER,
    ENUM,
    Deferrable: {
        INITIALLY_IMMEDIATE,
    },
} = Sequelize;

Transaction.init({
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
            model: Dapp,
            key: 'id',
            deferrable: INITIALLY_IMMEDIATE,
        },
    },
    value: {
        type: INTEGER,
        allowNull: false,
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
}, {
    sequelize,
    modelName: 'dapp',
    timestamps: true,
});

module.exports = Transaction;