const {
    isValidData,
} = require('../utils/data');
const {
    isAPIKeyValid,
} = require('../utils/dapp');
const {
    BAD_400,
    ACCESS_DENIED_401,
} = require('./responses');
const {
    getDappInfo,
    isOriginBelongsToApiKeyValid,
} = require('../utils/dapp')


module.exports = async ({
    apiKey: {
        isRequired: isApiKeyRequired,
        value: apiKeyValue,
    } = {},
    data: {
        isRequired: isRequiredData,
        value: dataValue,
    } = {},
    origin: {
        isRequired: isRequiredOrigin,
        value: originValue,
    } = {},
    networkId: {
        isRequired: isRequiredNetworkId,
        value: networkIdValue,
    } = {},
}) => {
    if (isApiKeyRequired && !apiKeyValue) {
        return {
            error: BAD_400('"ApiKey" parameter is required'),
            validatedData: null,
        };
    }

    if (isRequiredNetworkId && !networkIdValue) {
        return {
            error: BAD_400('"networkId" parameter is required'),
            validatedData: null,
        }
    }

    if (isRequiredData && !dataValue) {
        return {
            error: BAD_400('"data" parameter is required'),
            validatedData: null,
        };
    }

    if (isRequiredData && !isValidData(dataValue)) {
        // eslint-disable-next-line max-len
        return {
            error: BAD_400('"data" parameter is not valid. be a map with fields: relayerAddress, from, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayHubAddress, to'),
            validatedData: null,
        };
    }

    if (isApiKeyRequired) {
        const dappInfo = await getDappInfo({ apiKey: apiKeyValue });
        if (!dappInfo) {
            return {
                error: ACCESS_DENIED_401('Provided not right apiKey'),
                validatedData: null,
            };
        }
    }

    if (isApiKeyRequired && isRequiredOrigin) {
        const isValidOrigin = await isOriginBelongsToApiKeyValid({
            apiKey: apiKeyValue,
            origin: originValue,
        });
        if (!isValidOrigin) {
            return {
                error: ACCESS_DENIED_401('Origin is not correct'),
                validatedData: null,
            };
        }
    }

    return {
        error: null,
        validatedData: {
            apiKey: apiKeyValue,
            data: dataValue,
            origin: originValue,
        },
    };
}