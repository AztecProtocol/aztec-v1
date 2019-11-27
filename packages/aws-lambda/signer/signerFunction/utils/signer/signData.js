const web3Service = require('../../services/Web3Service');
const {
    errorLog,
} = require('../log');

module.exports = async (data, accout) => {
    if (!data) {
        errorLog('Data cannot be empty');
        return null;
    }
    return web3Service.signData(data, accout);
};
