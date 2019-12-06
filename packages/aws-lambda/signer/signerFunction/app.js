const {
    OK_200,
    NOT_FOUND_404,
    BAD_400,
} = require('./helpers/responses');
const {
    validateRequestData,
    isAuthorizationRequired,
    createApprovalData,
} = require('./helpers');
const {
    getParameters,
} = require('./utils/event');
const {
    errorLog,
} = require('./utils/log');


const responseOptions = (origin) => ({
    headers: {
        'Access-Control-Allow-Origin': origin,
    },
});

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

    const authorizationRequired = isAuthorizationRequired(networkId);

    try {
        const {
            error: validationError,
        } = await validateRequestData({
            apiKey: {
                isRequired: authorizationRequired,
                value: apiKey,
            },
            origin: {
                isRequired: authorizationRequired,
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

        const {
            error: approvalError,
            result,
        } = await createApprovalData({
            networkId,
            apiKey,
            data,
            authorizationRequired,
        });
        if (approvalError) {
            return approvalError;
        }
        const options = responseOptions(origin);
        return OK_200(result, options);

    } catch (e) {
        errorLog(e);
        return BAD_400({
            message: e.message,
        });
    };
};
