module.exports = (sequelize, DataTypes) => {
    const {
        STRING,
        BOOLEAN,
    } = DataTypes;

    const Dapps = sequelize.define('Dapps', {
        apiKey: {
            type: STRING,
            allowNull: false,
            unique: true,
        },
        isEnabled: {
            type: BOOLEAN,
            allowNull: false,
        },
        origin: {
            type: STRING,
            allowNull: false,
        },
    }, {})
    Dapps.associate = function (models) {
      // associations can be defined here
    }
    return Dapps
};
