const web3Factory = require('../services/Web3Service/helpers/web3Factory');


module.exports = ({
    signature,
    networkId,
}) => {
    const web3Service = web3Factory.getWeb3Service(networkId);
    return web3Service.web3.utils.keccak256(signature);
};
