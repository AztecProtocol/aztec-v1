const {
    isValidData,
} = require('../utils/data');
const {
    isAPIKeyValid,
    balance,
    getDappInfo,
} = require('../utils/dapp');
const {
    BAD_400,
    ACCESS_DENIED_401,
} = require('./responses');
const isTrue = require('./isTrue');


module.exports = async ({
    apiKey,
    data,
    origin,
}) => {
    if (!apiKey) {
        return {
            error: BAD_400('"ApiKey" parameter is requeired'),
            validatedData: { },
        };
    }

    if (!data) {
        return {
            error: BAD_400('"data" parameter is requeired'),
            validatedData: { },
        };
    }

    if (!isValidData(data)) {
        // eslint-disable-next-line max-len
        return {
            error: BAD_400('"data" parameter is not valid. be a map with fields: relayerAddress, from, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayHubAddress, to'),
            validatedData: { },
        };
    }

    const isApiKeyRequired = isTrue(process.env.API_KEY_REQUIRED);
    if (isApiKeyRequired && !await isAPIKeyValid({
        apiKey,
        origin,
    })) {
        return {
            error: ACCESS_DENIED_401(),
            validatedData: { },
        };
    }

    const {
        id: dappId,
    } = await getDappInfo({
        apiKey,
    });

    const countFreeTransactions = await balance({
        dappId,
    });
    if (countFreeTransactions <= 0) {
        return {
            error: ACCESS_DENIED_401({
                title: "Not enought free trnsaction, please contact to the dapp's support",
            }),
            validatedData: { },
        };
    }

    return {
        error: null,
        validatedData: {
            apiKey,
            data,
            origin,
            countFreeTransactions,
            isApiKeyRequired,
            dappId,
        },
    };
}