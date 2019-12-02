const initDapp = require('./dapp');
const initTransaction = require('./transaction');
const initUsers = require('./user');


module.exports = () => {
    initDapp();
    initTransaction();
    initUsers();
};
