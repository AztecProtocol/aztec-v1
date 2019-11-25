const {
    OK_200,
    NOT_FOUND_404,
    BAD_400,
} = require('./helpers/responses');
const {
    validateRequestData,
    registerContracts,
    refreshPendingTxs,
} = require('./helpers');
const web3Service = require('./services/Web3Service');
const {
    errorLog,
} = require('./utils/log');
const dbConnection = require('./database/helpers/connection');
const db = require('./database');
const {
    NETWORKS,
} = require('./config/constants');
const {
    balance,
    getDappInfo,
} = require('./utils/dapp');


const initializeDB = ({
    networkId,
}) => {
    dbConnection.init({
        networkId,
    });
    const {
        models: {
            init: initModels,
        },
    } = db;
    initModels();
};

const initializeWeb3Service = ({
    networkId,
}) => {
    const network = Object.values(NETWORKS).find(({ id }) => id === networkId);
    if (!network || !networkId) {
        throw new Error('Passed not right "networkId"');
    }
    const account = {
        address: process.env.SIGNER_ADDRESS,
        privateKey: process.env.SIGNER_PRIVATE_KEY,
    };
    web3Service.init({
        providerURL: network.infuraProviderUrl,
        account,
    });
    registerContracts();
};

const initialize = ({
    networkId,
}) => {
    initializeDB({
        networkId,
    });
    initializeWeb3Service({
        networkId,
    });
};

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.balanceHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return NOT_FOUND_404();
    }
    const {
        apiKey,
        networkId,
    } = event.pathParameters || {};

    try {
        initialize({
            networkId,
        });
    } catch (e) {
        return BAD_400(e.toString());
    }

    const {
        error: validationError,
    } = await validateRequestData({
        apiKey: {
            isRequired: true,
            value: apiKey,
        },
        networkId: {
            isRequired: true,
            value: networkId,
        },
    });
    if (validationError) {
        return validationError;
    }

    const {
        id: dappId,
    } = await getDappInfo({
        apiKey,
    });

    try {
        await refreshPendingTxs({
            dappId,
            networkId,
        });
        const countFreeTransactions = await balance({
            dappId,
        });

        return OK_200({
            hasFreeTransactions: countFreeTransactions > 0,
        });

    } catch (e) {
        errorLog(e);
        return BAD_400({
            message: e.toString(),
        });
    }
};
