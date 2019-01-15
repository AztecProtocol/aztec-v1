const deployer = require('../../../deployer');
const transactions = require('../../transactions');
const wallets = require('../../wallets');
const { TX_TYPES } = require('../../../config');

const Doorbell = require('../../../../build/contracts/Doorbell.json');

const { web3 } = deployer;

const doorbell = {};

doorbell.getContractAddress = async () => {
    const networkId = await deployer.getNetwork();
    if (!Doorbell.networks[networkId] || !Doorbell.networks[networkId].address) {
        throw new Error(`Doorbell.sol not deployed to network ${networkId}`);
    }
    return Doorbell.networks[networkId].address;
};

doorbell.setBlock = async (from) => {
    const contractAddress = await doorbell.getContractAddress();
    const fromWallet = wallets.get(from);

    const doorbellContract = new web3.eth.Contract(Doorbell.abi, contractAddress);
    doorbellContract.contractAddress = contractAddress; // have to set this explicitly

    const transactionHash = await deployer.methodCall(
        [],
        {
            contract: doorbellContract,
            method: 'setBlock',
            wallet: fromWallet,
        }
    );

    // add transaction
    transactions.newTransaction(TX_TYPES.DOORBELL_SET_BLOCK, transactionHash);

    return transactionHash;
};

doorbell.contract = async () => {
    return new web3.eth.Contract(Doorbell.abi, await doorbell.getContractAddress());
};

module.exports = doorbell;
