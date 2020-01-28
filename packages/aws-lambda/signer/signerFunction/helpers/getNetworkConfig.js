const { NETWORKS } = require('../config/constants');
const isGanacheNetwork = require('./isGanacheNetwork');

module.exports = (networkId) => {
    const isGanache = isGanacheNetwork(networkId);
    if (isGanache) {
        return NETWORKS.GANACHE;
    }
    return Object.values(NETWORKS).find(({ id }) => id === networkId);
};
