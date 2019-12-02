const Sequelize = require('sequelize');

const {
    Model,
} = Sequelize;

class Dapps extends Model {}
class Transactions extends Model {}
class Users extends Model {}

module.exports = {
    Dapps,
    Transactions,
    Users,
};
