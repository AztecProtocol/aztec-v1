const {
    BAD_400,
} = require('./responses');
const {
    ids,
} = require('./networks');
const isGanacheNetwork = require('./isGanacheNetwork');


module.exports = (networkId) => {
    if (!networkId) {
        return {
            error: BAD_400('"networkId" parameter is required'),
            isValid: false,
            isGanage: false,
        };
    }

    const isGanage = isGanacheNetwork(networkId);
    if (!ids.includes(networkId) && !isGanage) {
        return {
            error: BAD_400(`"networkId" parameter has to be one of ${ids.join(', ')} values or ganache networkId`),
            isValid: false,
            isGanage: false,
        };
    }

    return {
        error: null,
        isValid: true,
        isGanage,
    };
};