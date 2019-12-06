const {
    USER_TYPE,
    EMAIL_ADDRESS_LEGNTH,
    PASSWORD_HASH_LEGNTH,
} = require('../../config/constants');


module.exports = {
    up: (queryInterface, DataTypes) => {
        const {
            STRING,
            INTEGER,
            ENUM,
            DATE,
            BOOLEAN,
        } = DataTypes;

        return queryInterface.createTable('Users', {
            id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: INTEGER,
            },
            email: {
                type: STRING(EMAIL_ADDRESS_LEGNTH),
                allowNull: false,
                unique: true,
            },
            passwordHash: {
                type: STRING(PASSWORD_HASH_LEGNTH),
                allowNull: false,
            },
            role: {
                type: ENUM,
                allowNull: false,
                values: [
                    USER_TYPE.ADMIN,
                    USER_TYPE.USER,
                ],
            },
            isEnabled: {
                type: BOOLEAN,
                allowNull: false,
            },
            createdAt: {
                type: DATE,
                allowNull: false,
            },
            updatedAt: {
                type: DATE,
                allowNull: false,
            },
        });
    },
    down: (queryInterface, DataTypes) => {
        return queryInterface.dropTable('Users');
    },
};