const {
    NETWORKS,
} = require('../config/constants');


module.exports = (networkId)=> {
    return Object.values(NETWORKS).find(({ id }) => id === networkId);
};
