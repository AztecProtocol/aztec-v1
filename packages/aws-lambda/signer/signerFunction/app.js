const {
    signData,
} = require('./utils/signer');
const {
    OK_200,
    NOT_FOUND_404,
    BAD_400,
    ACCESS_DENIED_401,
} = require('./helpers/responses');
const {
    validateRequestData,
    registerContracts,
    refreshPendingTxs,
    validateNetworkId,
    isGanacheNetwork,
} = require('./helpers');
const {
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

const getTrustedAccount = (networkId) => {
    const isGanache = isGanacheNetwork(networkId);
    if (isGanache) {
        return {
            address: process.env.SIGNER_GANACHE_ADDRESS,
            privateKey: process.env.SIGNER_GANACHE_PRIVATE_KEY,
        };
    }

    return {
        address: process.env.SIGNER_ADDRESS,
        privateKey: process.env.SIGNER_PRIVATE_KEY,
    };
}

const getNetworkConfig = (networkId)=> {
    const isGanache = isGanacheNetwork(networkId);
    if (isGanache) {
        return NETWORKS.GANACHE;
    };
    return Object.values(NETWORKS).find(({ id }) => id === networkId);
}

const initializeWeb3Service = ({
    networkId,
}) => {
    const account = getTrustedAccount(networkId);
    const network = getNetworkConfig(networkId);
    web3Service.init({
        providerURL: network.infuraProviderUrl,
        account,
    });
    registerContracts();
};

const initialize = ({
    networkId,
    isGanache,
}) => {
    if(!isGanache) {
        initializeDB({
            networkId,
        });
    }
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
exports.signTxHandler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return NOT_FOUND_404();
    }
    const {
        body: {
            data,
        },
        path: {
            apiKey,
            networkId,
        },
        headers: {
            origin,
        },
    } = getParameters(event) || {};

    const {
        isValid,
        isGanache,
        error: networkIdError,
    } = validateNetworkId(networkId);
    if (!isValid) {
        return networkIdError;
    }

    initialize({
        networkId,
        isGanache,
    });

    const isApiKeyRequired = isGanache ? false : isTrue(process.env.API_KEY_REQUIRED);
    const {
        error: validationError,
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
        let dappId;
        if (isApiKeyRequired) {
            const {
                id,
            } = await getDappInfo({
                apiKey,
            });
            dappId = id;

            await refreshPendingTxs({
                dappId,
                networkId,
            });
            const countFreeTransactions = await balance({
                dappId,
            });
            if (countFreeTransactions <= 0) {
                return ACCESS_DENIED_401({
                    title: "Not enough free transaction, please contact to the dapp's support",
                });
            }
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

        const result = {
            data,
            dataHash,
            dataSignature: signature,
        };
        if (isGanache) {
            result.isGanache = true;
        }
        return OK_200(result);

    } catch (e) {
        errorLog(e);
        return BAD_400({
            message: e.toString(),
        });
    }
};
