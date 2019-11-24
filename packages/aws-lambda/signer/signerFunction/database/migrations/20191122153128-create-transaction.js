const {
    TRANSACTION_TYPE,
    TRANSACTION_STATUS,
    SHA3_LENGTH,
    ETH_ADDRESS_LENGTH,
} = require('../../config/constants');


module.exports = {
    up: (queryInterface, DataTypes) => {
        const {
            STRING,
            INTEGER,
            ENUM,
            Deferrable: {
                INITIALLY_IMMEDIATE,
            },
        } = DataTypes;

        return queryInterface.createTable('Transactions', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: INTEGER,
            },
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
                onDelete: 'CASCADE',
                references: {
                    model: 'Dapps',
                    key: 'id',
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
            nonce: {
                type: INTEGER,
                unique: true,
                allowNull: false,
            },
        });
    },
    down: (queryInterface, DataTypes) => {
        return queryInterface.dropTable('Transactions');
    },
};