const {
    OK_200,
    NOT_FOUND_404,
    BAD_400,
} = require('./helpers/responses');
const {
    validateRequestData,
    isAuthorizationRequired,
    hasFreeTransactions,
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
exports.balanceHandler = async (event) => {
    if (event.httpMethod !== 'GET') {
        return NOT_FOUND_404();
    }
    const {
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
                isRequired: false,
                value: origin,
            },
            data: {
                isRequired: false,
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
        } = await hasFreeTransactions({
            networkId,
            apiKey,
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
