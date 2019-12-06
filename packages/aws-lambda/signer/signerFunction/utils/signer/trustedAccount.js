const isGanacheNetwork = require('../../helpers/isGanacheNetwork');


module.exports = (networkId) => {
    const isGanache = isGanacheNetwork(networkId);
    if (isGanache) {
        return {
            address: process.env.SIGNER_GANACHE_ADDRESS,
            privateKey: process.env.SIGNER_GANACHE_PRIVATE_KEY,
        };
    }

    return {
        address: process.env.SIGNER_ADDRESS,
        privateKey: process.env.SIGNER_PRIVATE_KEY,
    };
};
