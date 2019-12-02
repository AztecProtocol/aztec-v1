const Sequelize = require('sequelize');
const {
    connection,
} = require('../helpers');
const {
    Users,
} = require('./types');
const {
    EMAIL_ADDRESS_LEGNTH,
    PASSWORD_HASH_LEGNTH,
    USER_TYPE,
} = require('../../config/constants');

const {
    STRING,
    BOOLEAN,
    ENUM,
} = Sequelize;

module.exports = () => {
    Users.init({
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
    }, {
        sequelize: connection.getConnection(),
        modelName: 'Users',
        timestamps: true,
    });
};
