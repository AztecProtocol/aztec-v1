const web3Service = require('../services/Web3Service');

module.exports = (txSignature) => {
    return web3Service.web3.sha3(txSignature);
};
