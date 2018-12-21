const { walletsDatabase: database } = require('../../db');

const wallets = {};

wallets.getInitialState = () => ({
    publicKey: '',
    privateKey: '',
    name: '',
});

wallets.create = (data) => {
    const wallet = database().get('wallets').find({ name: data.name }).value();
    if (wallet) {
        throw new Error('wallet already exists');
    }
    database().get('wallets')
        .push({ ...wallets.getInitialState(), ...data })
        .write();
    return database().get('wallets')
        .find({ name: data.name })
        .value();
};

wallets.update = (address, data) => {
    const wallet = database().get('wallets')
        .find({ address })
        .assign(data)
        .write();
    return wallet;
};

wallets.get = (address) => {
    const wallet = database().get('wallets')
        .find({ address })
        .value();
    return wallet;
};

module.exports = wallets;
