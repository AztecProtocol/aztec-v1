const {
    signData,
} = require('./utils/signer');
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
const {
    getOrigin,
    getParameters,
} = require('./utils/event');
const web3Service = require('./services/Web3Service');
const {
    monitorTx,
} = require('./utils/transactions');
const {
    errorLog,
} = require('./utils/log');
const dbConnection = require('./database/helpers/connection');
const db = require('./database');
const {
    NETWORKS,
} = require('./config/constants');
const isTrue = require('./helpers/isTrue');


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
exports.migrationHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return NOT_FOUND_404();
    }
    const {
        apiKey,
        data,
        networkId,
    } = getParameters(event) || {};
    const origin = getOrigin(event);

    const isApiKeyRequired = isTrue(process.env.API_KEY_REQUIRED);

    try {
        initialize({
            networkId,
        });
    } catch (e) {
        return BAD_400(e.toString());
    }

    const {
        error: validationError,
        validatedData: {
            dappId,
        },
    } = await validateRequestData({
        apiKey: {
            isRequired: isApiKeyRequired,
            value: apiKey,
        },
        origin: {
            isRequired: isApiKeyRequired,
            value: origin,
        },
        data: {
            isRequired: true,
            value: data,
        },
        networkId: {
            isRequired: true,
            value: networkId,
        },
    });
    if (validationError) {
        return validationError;
    }

    try {
        if (isApiKeyRequired) {
            await refreshPendingTxs({
                dappId,
                networkId,
            });
        }

        const {
            messageHash: dataHash,
            signature,
        } = await signData(data);

        if (isApiKeyRequired) {
            await monitorTx({
                ...data,
                dappId,
                signature,
            });
        }

        return OK_200({
            data,
            dataHash,
            dataSignature: signature,
        });

    } catch (e) {
        errorLog(e);
        return BAD_400({
            message: e.toString(),
        });
    }
};
