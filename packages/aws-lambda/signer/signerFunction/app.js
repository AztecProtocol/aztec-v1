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
    // if (event.httpMethod !== 'POST') {
    //     return ACCESS_NOT_FOUND_404();
    // }
    // const {
    //     apiKey,
    //     data,
    //     // TODO: Pass as parameter
    //     networkId = 4,
    // } = getParameters(event) || {};
    // const origin = getOrigin(event);

    const {
        apiKey,
        data,
        networkId,
        origin,
    } = {
        "data": {
            "from": "0xfb90c082c1397b9dc3ebbaee1c66d0d20f83bbb8",
            "to": "0xa63e48dc73aeb8a56f936a20a60afa266c049507",
            "encodedFunctionCall": "0x7e8b882c00000000000000000000000074fa6c394fc13b4247880867ca2eff90a61c3e10000000000000000000000000000000000000000000000000000000000000006000000000000000000000000000000000000000000000000000000000000004a000000000000000000000000000000000000000000000000000000000000004020000000000000000000000000000000000000000000000000000000000000000218bb6f5fca0570a7bba401e361f9b7e5199111e9d23a9ec7921f1d04ef0d437000000000000000000000000fb90c082c1397b9dc3ebbaee1c66d0d20f83bbb8000000000000000000000000000000000000000000000000000000000000010000000000000000000000000000000000000000000000000000000000000002a000000000000000000000000000000000000000000000000000000000000002c0000000000000000000000000000000000000000000000000000000000000032000000000000000000000000000000000000000000000000000000000000000022a28ecdefae4902f42263aaa495698628e161ea55611808a4d402955ac9204af1c7a47afcdeb379fe03ed8042baf6eeb74bb4f3d0854d874abb3c402309f18781cf1cb39461c0e7d3ef137da5c451805db413977df1b27e4e8a997203f567fd81c0306b087b972003f3f3849e19ff4fe59ace285e649fa32f5299df58bc9346f0ee68677134cfa7a842bb754be71e50df30a8482cfb31f4224449b1685a3004d20e09157777663284b8c29799800e73d687af2f483535d663e32561be0a0feea30644e72e131a029b85045b68181585d2833e84879b9709143e1f593efffffe3060b409298581a12d8a0c5f71d9ee2137be892cdcb26d1d0dda3b207ec8f68ef033e42cf7a67b1631cf45eb5dd819bd1271422bc71fd87bdc4696055ecf30cb1073bd897adb4b90fa53e673418a77cbc3f424c781fe79a6038f530dbf28a04c512c0fff2beb80012d44aaee7c00e1dbf29935a9e5a790b3109143d3b940ff2770c553fff6e1376d3d329f87d6d9606daa0610485eb9303f7045a008507ce303d00000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000002000000000000000000000000bb31948c7365e6d4ef59751ca25c9d60e1faff9a000000000000000000000000bb31948c7365e6d4ef59751ca25c9d60e1faff9a00000000000000000000000000000000000000000000000000000000000000e20000000000000000000000000000000000000000000000000000000000000002000000000000000000000000000000000000000000000000000000000000008000000000000000000000000000000000000000000000000000000000000000c100000000000000000000000000000000000000000000000000000000000000218c5dec8e1cd9345b545b21c2fa4dcf194022cbe68089a20ec100b5ab73f4825d00000000000000000000000000000000000000000000000000000000000000002188e28ac6a80e2ac6e6d020a6cb8344583b34cc128dfd23f764f87c37f25dc3c7010000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000000",
            "txFee": 10,
            "gasPrice": "0x4a817c800",
            "gas": "0x7a1200",
            "nonce": 0,
            "relayerAddress": "0x41680f6037B257d0F6313038B3dAC0102f4Fd324",
            "relayHubAddress": "0xD216153c06E857cD7f72665E0aF1d7D82172F494",
        },
        "networkId": 4,
        "origin": "http://aztecprotocol.com",
        "apiKey": "aztecprotocol_api_key",
    };

    initialize({
        networkId,
    });

    const {
        error: validationError,
        validatedData: {
            isApiKeyRequired,
            dappId,
        },
    } = await validateRequestData({
        apiKey,
        origin,
        data,
        networkId,
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
        } = signData(data);
  
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

exports.migrationHandler3 = async (event) => {
    const {
        command = 'up',
    } = event;

    const {
        createDatabases,
        migrate,
        connect,
        close,
    } = db;

    /* eslint-disable no-await-in-loop */
    try {
        await createDatabases();

        for(let i = 0; i < networkIds.length; i += 1) {
            const networkId = networkIds[i];
            initializeDB({
                networkId,
            });
            await connect();
            await migrate(command);
            await close();
        }
        return OK_200();
    } catch (e) {
        errorLog(e);
        return BAD_400({
            message: e.toString(),
        });
    }
};