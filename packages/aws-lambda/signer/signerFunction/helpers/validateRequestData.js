const {
    isValidData,
} = require('../utils/data');
const {
    BAD_400,
    ACCESS_DENIED_401,
} = require('./responses');
const {
    getDappInfo,
    isOriginBelongsToApiKey,
} = require('../utils/dapp')
const {
    ids,
} = require('./networks');
const isTrue = require('./isTrue');
const isGanacheNetwork = require('./isGanacheNetwork');


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
        };
    }

    const isGanache = isGanacheNetwork(networkIdValue);
    const authorizationRequired = isGanache ? false : isTrue(process.env.API_KEY_REQUIRED);
    if (isRequiredNetworkId) {
        if (!ids.includes(networkIdValue) && !isGanache) {
            return {
                error: BAD_400(`"networkId" parameter has to be one of ${ids.join(', ')} values or ganache networkId`),
                validatedData: null,
            };
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
        const dappInfo = await getDappInfo({
            apiKey: apiKeyValue,
            networkId: networkIdValue,
        });
        if (!dappInfo) {
            return {
                error: ACCESS_DENIED_401('Provided not right apiKey'),
                validatedData: null,
            };
        }
    }

    if (isApiKeyRequired && isRequiredOrigin) {
        const isValidOrigin = await isOriginBelongsToApiKey({
            apiKey: apiKeyValue,
            origin: originValue,
            networkId: networkIdValue,
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
            authorizationRequired,
            apiKey: apiKeyValue,
            data: dataValue,
            origin: originValue,
        },
    };
}