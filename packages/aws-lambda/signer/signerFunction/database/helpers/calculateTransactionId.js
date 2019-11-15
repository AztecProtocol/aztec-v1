const web3Service = require('../../Web3Service');

module.exports = (txSignature) => {
    return web3Service.web3.sha3(txSignature);
};
