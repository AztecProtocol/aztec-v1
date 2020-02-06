const { loadEvents } = require('../utils/ethEvents');
const { updateExpiredTxs, updateMultipleTxs, pendingTxs } = require('../utils/transactions');
const { TRANSACTION_STATUS } = require('../config/constants');

module.exports = async ({ dappId, networkId }) => {
    const pending = await pendingTxs({
        dappId,
    });
    if (!pending.length) return;

    const signaturesHashes = pending.map(({ signatureHash }) => signatureHash);

    const transactions = await loadEvents({
        signaturesHashes,
        networkId,
    });

    const transactionsOK = transactions.filter(({ success }) => success);
    const transactionsFailed = transactions.filter(({ success }) => !success);

    /**
     * Update pending txs to OK status
     */
    if (transactionsOK.length) {
        const updateTxs = transactionsOK.map((tx) => ({
            signatureHash: tx.signatureHash,
            actualCharge: tx.actualCharge,
            status: TRANSACTION_STATUS.OK,
        }));
        await updateMultipleTxs(updateTxs);
    }

    /**
     * Update pending txs to Failed status
     */
    if (transactionsFailed.length) {
        const updateTxs = transactionsFailed.map((tx) => ({
            signatureHash: tx.signatureHash,
            actualCharge: tx.actualCharge,
            status: TRANSACTION_STATUS.FAILED,
        }));
        await updateMultipleTxs(updateTxs);
    }

    /**
     * Update pending txs to Expired status
     */
    await updateExpiredTxs();
};
