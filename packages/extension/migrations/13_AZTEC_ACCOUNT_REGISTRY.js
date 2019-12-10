const { fundRecipient } = require('@openzeppelin/gsn-helpers');
const { toWei } = require('web3-utils');
const Web3 = require('web3');

const AZTECAccountRegistry = artifacts.require('./AZTECAccountRegistryGSN.sol');
const ACE = artifacts.require('./ACE.sol');


module.exports = deployer => deployer.deploy(

    AZTECAccountRegistry,
    ACE.address,
    // TODO change to be from env
    '0x6794d16143e537a51d6745D3ae6bc99502b4331C', // RINKEBY
    // '0x24b934a7d1dd72bd8645a4958b0ff46bd29a5845'
).then(async (contract) => {

    let WEB3_PROVIDER_URL;

    if(network === 'development') {

         WEB3_PROVIDER_URL = 'http://127.0.0.1:8545';
    }
    else {
        WEB3_PROVIDER_URL = `https://${network}.infura.io/v3/${process.env.INFURA_API_KEY}`
    }
    
    const web3 = new Web3(WEB3_PROVIDER_URL);
    await fundRecipient(web3, {
        recipient: contract.address,
        amount: toWei('1'),
    });
});
