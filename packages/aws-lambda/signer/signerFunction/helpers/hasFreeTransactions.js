const {
    refreshPendingTxs,
} = require('../utils/transactions');
const {
    balance,
    getDappInfo,
} = require('../utils/dapp');


const authorizedHasFreeTransactions = async ({
    networkId,
    apiKey,
}) => {
    const {
        id: dappId,
    } = await getDappInfo({
        apiKey,
        networkId,
    });

    await refreshPendingTxs({
        dappId,
        networkId,
    });
    const countFreeTransactions = await balance({
        dappId,
        networkId,
    });

    return {
        error: null,
        result: {
            hasFreeTransactions: countFreeTransactions > 0,
        },
    }
};

const unauthorizedHasFreeTransactions = async () => {
    return {
        error: null,
        result: {
            hasFreeTransactions: true,
        },
    }
}

module.exports = async ({
    authorizationRequired,
    networkId,
    apiKey,
}) => {
    if (authorizationRequired) {
        return authorizedHasFreeTransactions({
            networkId,
            apiKey,
        });
    }
    return unauthorizedHasFreeTransactions();
};