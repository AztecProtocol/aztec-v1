const {
    dbFactory,
} = require('../../database');
const signatureHash = require('../signatureHash');
const {
    TRANSACTION_STATUS,
    TRANSACTION_TYPE,
} = require('../../config/constants');


module.exports = async ({
    dappId,
    signature,
    from,
    nonce,
    networkId,
}) => {
    const {
        Transactions,
    } = dbFactory.getDB(networkId);
    const hash = signatureHash({
        signature,
        networkId,
    });
    const status = TRANSACTION_STATUS.PENDING;
    const type = TRANSACTION_TYPE.SPENDING;
    const value = -1;

    const tx = await Transactions.create({
        signatureHash: hash,
        dappId,
        from,
        status,
        type,
        value,
        nonce,
    });

    return tx;
};