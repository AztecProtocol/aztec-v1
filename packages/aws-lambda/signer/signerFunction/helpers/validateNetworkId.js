const { BAD_400 } = require('./responses');
const { ids } = require('./networks');
const isTrue = require('./isTrue');
const isGanacheNetwork = require('./isGanacheNetwork');

module.exports = (networkId) => {
    if (!networkId) {
        return {
            error: BAD_400('"networkId" parameter is required'),
            isValid: false,
            isGanache: false,
        };
    }

    const isGanache = isGanacheNetwork(networkId);
    const authorizationRequired = isGanache ? false : isTrue(process.env.API_KEY_REQUIRED);
    if (!ids.includes(networkId) && !isGanache) {
        return {
            error: BAD_400(`"networkId" parameter has to be one of ${ids.join(', ')} values or ganache networkId`),
            isValid: false,
            isGanache: false,
            authorizationRequired,
        };
    }

    return {
        error: null,
        isValid: true,
        isGanache,
        authorizationRequired,
    };
};
