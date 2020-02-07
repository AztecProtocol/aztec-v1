const { Behaviour20200106 } = require('@aztec/contract-artifacts');
const web3Service = require('../services/Web3Service');

module.exports = () => {
    web3Service.registerInterface(Behaviour20200106, {name: 'AccountRegistry'});
};
