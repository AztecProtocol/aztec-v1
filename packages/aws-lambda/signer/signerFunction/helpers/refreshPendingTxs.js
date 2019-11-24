const {
    loadEvents,
} = require('../utils/ethEvents');
const {
    setStatusForTxs,
    pendingTxs,
} = require('../utils/transactions')
const {
    TRANSACTION_STATUS,
} = require('../config/constants');


module.exports = async ({
    dappId,
    networkId,
}) => {
    const pending = await pendingTxs(dappId);
    if (!pending.length) return;

    const signaturesHashes = pending.map(({
        signatureHash,
    }) => signatureHash);

    const {
        error,
        transactions,
    } = await loadEvents({
        signaturesHashes,
        networkId,
    });

    /**
     * Update pending txs to OK status
     */
    if (transactions.length) {
        const hashes = transactions.map(({ signatureHashe }) => signatureHashe);
        setStatusForTxs({
            status: TRANSACTION_STATUS.OK,
            signaturesHashes: hashes,
        });
    }

    /**
     * Update pending txs to Failed status
     */
    if (transactions.length) {

    }
    
}