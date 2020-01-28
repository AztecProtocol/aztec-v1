const web3Service = require('../services/Web3Service');

module.exports = (txSignature) => {
    return web3Service.web3.utils.keccak256(txSignature);
};
