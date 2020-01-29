const Sequelize = require('sequelize');

const { Model } = Sequelize;

class Dapps extends Model {}
class Transactions extends Model {}
class TransactionEthEvent extends Model {}

module.exports = {
    Dapps,
    Transactions,
    TransactionEthEvent,
};
