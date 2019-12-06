const {
    approveData,
} = require('../utils/signer');
const {
    monitorTx,
    refreshPendingTxs,
} = require('../utils/transactions');
const {
    balance,
    getDappInfo,
} = require('../utils/dapp');
const {
    ACCESS_DENIED_401,
} = require('./responses');


const authorizedApprovalData = async ({
    networkId,
    apiKey,
    data,
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
    if (countFreeTransactions <= 0) {
        return {
            error: ACCESS_DENIED_401({
                title: "Not enough free transaction, please contact to the dapp's support",
            }),
            result: null,
        }
    }

    const result = await approveData({
        data,
        networkId,
    });
    const {
        signature,
    } = result;

    await monitorTx({
        ...data,
        dappId,
        signature,
        networkId,
    });

    return {
        error: null,
        result,
    };
};

const unauthorizedApprovalData = async ({
    data,
    networkId,
}) => {
    const result = await approveData({
        data,
        networkId,
    });
    return {
        error: null,
        result,
    };
}


module.exports = async ({
    networkId,
    apiKey,
    data,
    authorizationRequired,
}) => {
    if (authorizationRequired) {
        return authorizedApprovalData({
            networkId,
            apiKey,
            data,
        });
    }
    return unauthorizedApprovalData({
        data,
        networkId,
    });
};
