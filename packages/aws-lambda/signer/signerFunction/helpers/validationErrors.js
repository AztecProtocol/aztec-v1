const {
    isValidData,
} = require('../utils/data');
const {
    isAPIKeyValid,
    countFreeTransactions,
} = require('../utils/dapp');
const {
    OK_200,
    BAD_400,
    ACCESS_DENIED_401,
    ACCESS_NOT_FOUND_404,
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

    const freeTransactions = await countFreeTransactions(apiKey);
    if (freeTransactions === 0) {
        return ACCESS_DENIED_401({
            title: "Not enought free trnsaction, please contact to the dapp's support",
        });
    }

    return null;
}