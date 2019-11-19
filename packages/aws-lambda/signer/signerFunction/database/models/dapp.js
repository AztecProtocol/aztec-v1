const Sequelize = require('sequelize');
const sequelize = require('../helpers/connection');
const {
    Dapp,
} = require('./types');

const {
    STRING,
    BOOLEAN,
} = Sequelize;

Dapp.init({
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
}, {
    sequelize,
    modelName: 'dapp',
    timestamps: true,
});

module.exports = Dapp;
