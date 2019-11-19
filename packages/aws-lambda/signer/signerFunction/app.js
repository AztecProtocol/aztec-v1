const {
    signData,
} = require('./utils/signer');
const {
    OK_200,
    ACCESS_NOT_FOUND_404,
} = require('./helpers/responses');
const validationErrors = require('./helpers/validationErrors');
const {
    getOrigin,
    getParameters,
} = require('./utils/event');
const web3Service = require('./services/Web3Service');
const {
    monitorTx,
    getDappInfo,
} = require('./utils/dapp')


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
    if (event.httpMethod !== 'POST') {
        return ACCESS_NOT_FOUND_404();
    }
    initialize();

    const {
        apiKey,
        data,
    } = getParameters(event) || {};
    const origin = getOrigin(event);

    const validationError = validationErrors({
        apiKey,
        origin,
        data,
    });
    if (validationError) {
        return validationError;
    }

    const {
        messageHash: dataHash,
        signature,
    } = signData(data);
    const {
        dappId,
    } = await getDappInfo(apiKey);
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
};
