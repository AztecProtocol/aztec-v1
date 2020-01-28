const { NETWORKS } = require('../config/constants');

module.exports = {
    ids: Object.values(NETWORKS)
        .map(({ id }) => id)
        .filter((id) => !!id),
    names: Object.values(NETWORKS).map(({ networkName }) => networkName),
};
