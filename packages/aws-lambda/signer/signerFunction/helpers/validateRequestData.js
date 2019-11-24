const {
    isValidData,
} = require('../utils/data');
const {
    isAPIKeyValid,
    balance,
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
        return BAD_400('"ApiKey" parameter is requeired');
    }

    if (!data) {
        return BAD_400('"data" parameter is requeired');
    }

    if (!isValidData(data)) {
        // eslint-disable-next-line max-len
        return BAD_400('"data" parameter is not valid. be a map with fields: relayerAddress, from, encodedFunctionCall, txFee, gasPrice, gas, nonce, relayHubAddress, to');
    }

    const isApiKeyRequired = isTrue(process.env.API_KEY_REQUIRED);
    if (isApiKeyRequired && !await isAPIKeyValid({
        apiKey,
        origin,
    })) {
        return ACCESS_DENIED_401();
    }

    const countFreeTransactions = await balance(apiKey);
    if (countFreeTransactions <= 0) {
        return ACCESS_DENIED_401({
            title: "Not enought free trnsaction, please contact to the dapp's support",
        });
    }

    return null;
}