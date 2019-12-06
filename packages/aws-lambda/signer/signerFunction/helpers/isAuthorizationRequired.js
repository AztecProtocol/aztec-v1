const isTrue = require('./isTrue');
const isGanacheNetwork = require('./isGanacheNetwork');


module.exports = (networkId) => {
    const isGanache = isGanacheNetwork(networkId);
    return isGanache ? false : isTrue(process.env.API_KEY_REQUIRED);
};
