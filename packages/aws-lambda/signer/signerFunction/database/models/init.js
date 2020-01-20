const initDapp = require('./dapp');
const initTransaction = require('./transaction');

module.exports = () => {
    initDapp();
    initTransaction();
};
