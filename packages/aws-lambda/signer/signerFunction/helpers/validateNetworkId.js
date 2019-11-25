const {
    BAD_400,
} = require('./responses');
const {
    ids,
} = require('./networks');


module.exports = (networkId) => {
    if (!networkId) {
        return {
            error: BAD_400('"networkId" parameter is required'),
            isValid: false,
        };
    }

    if (!ids.includes(networkId)) {
        return {
            error: BAD_400('"networkId" parameter has to be numeric value'),
            isValid: false,
        };
    }
    return {
        error: null,
        isValid: true,
    };
};