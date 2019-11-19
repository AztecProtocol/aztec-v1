const Sequelize = require('sequelize');

const {
    Model,
} = Sequelize;

class Dapp extends Model {}
class Transaction extends Model {}

module.exports = {
    Dapp,
    Transaction,
};
