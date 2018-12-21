const { database } = require('../../db');

const transactions = {};

transactions.getInitialState = () => ({
    transactionHash: '',
    status: 'NULL',
    type: 'NULL',
});

transactions.create = (data) => {
    const transaction = database().get('transactions').find({ transactionHash: data.transactionHash }).value();
    if (transaction) { throw new Error(`transaction ${data.transactionHash} already exists`); }
    database().get('transactions')
        .push({ ...transactions.getInitialState(), ...data })
        .write();
    const result = database().get('transactions').find({ transactionHash: data.transactionHash }).value();
    return result;
};

transactions.update = (transactionHash, data) => {
    const transaction = database()
        .get('transactions')
        .find({ transactionHash })
        .assign(data)
        .write();
    return transaction;
};

transactions.get = (transactionHash) => {
    const transaction = database().get('transactions').find({ transactionHash }).value();
    return transaction;
};

module.exports = transactions;
