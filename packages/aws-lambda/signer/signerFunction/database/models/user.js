const {
    EMAIL_ADDRESS_LEGNTH,
    PASSWORD_HASH_LEGNTH,
    USER_TYPE,
} = require('../../config/constants');


module.exports = (sequelize, DataTypes) => {
    const {
        STRING,
        BOOLEAN,
        ENUM,
    } = DataTypes;

    const Users = sequelize.define('Users', {
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
    }, {});
    Users.associate = (models) => {
        // associations can be defined here
    };
    return Users;
};
