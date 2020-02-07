const Sequelize = require('sequelize');
const { connection } = require('../helpers');
const { Dapps } = require('./types');

const { STRING, BOOLEAN } = Sequelize;

module.exports = () => {
    Dapps.init(
        {
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
        },
        {
            sequelize: connection.getConnection(),
            modelName: 'Dapps',
            timestamps: true,
        },
    );
};
