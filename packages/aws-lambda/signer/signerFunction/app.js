const {
    signData,
} = require('./utils/signer');
const {
    OK_200,
    ACCESS_NOT_FOUND_404,
    BAD_400,
} = require('./helpers/responses');
const {
    validateRequestData,
    registerContracts,
    refreshPendingTxs,
    networks: {
        ids: networkIds,
    },
} = require('./helpers');
const {
    getOrigin,
    getParameters,
} = require('./utils/event');
const web3Service = require('./services/Web3Service');
const {
    getDappInfo,
} = require('./utils/dapp');
const {
    monitorTx,
} = require('./utils/transactions');
const {
    log,
    errorLog,
} = require('./utils/log');
const dbConnection = require('./database/helpers/connection');
const db = require('./database');


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
    const providerURL = process.env.WEB3_PROVIDER_URL;
    const account = {
        address: process.env.SIGNER_ADDRESS,
        privateKey: process.env.SIGNER_PRIVATE_KEY,
    };
    web3Service.init({
        providerURL,
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
        return ACCESS_NOT_FOUND_404();
    }
    const {
        apiKey,
        data,
        // TODO: Pass as parameter
        networkId = 4,
    } = getParameters(event) || {};
    const origin = getOrigin(event);

    initialize({
        networkId,
    });

    const validationError = await validateRequestData({
        apiKey,
        origin,
        data,
        networkId,
    });
    if (validationError) {
        return validationError;
    }

    try {
        const {
            dappId,
        } = await getDappInfo(apiKey);

        await refreshPendingTxs({
            dappId,
            networkId,
        });

        const {
            messageHash: dataHash,
            signature,
        } = signData(data);
        const {
            from,
        } = data;

        await monitorTx({
            dappId,
            signature,
            from,
        });

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

// exports.migrationHandler2 = async (event) => {
//     const {
//         command = 'up',
//     } = event;

//     const {
//         createDatabases,
//         migrate,
//         connect,
//         close,
//     } = db;

//     /* eslint-disable no-await-in-loop */
//     try {
//         await createDatabases();

//         for(let i = 0; i < networkIds.length; i += 1) {
//             const networkId = networkIds[i];
//             initializeDB({
//                 networkId,
//             });
//             await connect();
//             await migrate(command);
//             await close();
//         }
//         return OK_200();
//     } catch (e) {
//         errorLog(e);
//         return BAD_400({
//             message: e.toString(),
//         });
//     }
// };