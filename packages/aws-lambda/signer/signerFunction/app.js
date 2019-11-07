const {
    signData,
} = require('./utils/signer');
const {
    isAPIKeyValid,
    // getDappHash,
} = require('./utils/dapp');
const {
    OK_200,
    BAD_400,
    ACCESS_DENIED_401,
} = require('./helpers/responses');
const {
    getOrigin,
    getParameters,
} = require('./utils/event');
const {
    isValidData,
} = require('./utils/data');
const web3Service = require('./services/Web3Service');

const initialize = () => {
    const providerURL = process.env.WEB3_PROVIDER_URL;
    const account = {
        address: process.env.SIGNER_ADDRESS,
        privateKey: process.env.SIGNER_PRIVATE_KEY,
    };
    web3Service.init({
        providerURL,
        account,
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
exports.lambdaHandler = async (event) => {
    if (event.httpMethod !== 'POST') return null;
    initialize();

    const origin = getOrigin(event);
    const {
        apiKey,
        data,
    } = getParameters(event) || {};

    if (!apiKey) {
        return BAD_400('"ApiKey" parameter is requeired');
    }

    if (!data) {
        return BAD_400('"data" parameter is requeired');
    }

    if (!isValidData(data)) {
        return BAD_400('"data" parameter is not valid. be a map with fields: relayerAddress, from, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayHubAddress, to');
    }

    if (!isAPIKeyValid({
        apiKey,
        origin,
    })) {
        return ACCESS_DENIED_401();
    }

    const {
        messageHash: dataHash,
        signature: dataSignature,
    } = signData(data);

    return OK_200({
        data,
        dataHash,
        dataSignature,
    });
};
