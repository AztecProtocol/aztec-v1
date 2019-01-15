/**
 * Exposes an interface to broadcast transactions to the AZTEC smart contract verifier
 *
 * @module aztecController
 */

const deployer = require('../../../deployer');
const wallets = require('../../wallets');
const transactions = require('../../transactions');
const { t2 } = require('../../../../aztec-crypto-js/params');
const { TX_TYPES } = require('../../../config');

const AZTEC = require('../../../../build/contracts/AZTEC.json');
const AZTECInterface = require('../../../../build/contracts/AZTECInterface.json');

const { web3 } = deployer;
AZTEC.abi = AZTECInterface.abi; // hon hon hon

const aztec = {};

/**
 * Get the AZTEC validator contract address
 * @method getContractAddress
 * @returns {string} the contract address
 */
aztec.getContractAddress = async () => {
    const networkId = await deployer.getNetwork();
    if (!AZTEC.networks[networkId] || !AZTEC.networks[networkId].address) {
        throw new Error(`AZTEC.sol not deployed to network ${networkId}`);
    }
    // truffle ^5.0 returns a checksummed addresses and this messes up with the bytecode comparison tests
    return AZTEC.networks[networkId].address.toLowerCase();
};

/**
 * Broadcast a join-split AZTEC zero-knowledge proof to the verifier.  
 *   If successful, transaction receipt will have a status of ```true```.  
 *   If the proof is invalid, the receipt's status will be ```false``` (tx will throw)
 * @method joinSplit
 * @param {string} address Ethereum address of transaction sender
 * @param {string[]} proofData AZTEC zero-knowledge proof data
 * @param {string} m bytes32 formatted number of input notes
 * @param {string} challenge AZTEC zero-knowledge proof challenge variable
 * @returns {string} the created transaction's transaction hash
 */
aztec.joinSplit = async (address, proofData, m, challenge) => {
    const wallet = wallets.get(address);

    const contractAddress = await aztec.getContractAddress();
    const aztecContract = new web3.eth.Contract(AZTEC.abi, contractAddress);
    aztecContract.contractAddress = contractAddress;

    const transactionHash = await deployer.methodCall(
        [proofData, m, challenge, t2],
        {
            contract: aztecContract,
            method: 'validateJoinSplit',
            wallet,
        }
    );

    transactions.newTransaction(TX_TYPES.AZTEC_JOIN_SPLIT, transactionHash);

    return transactionHash;
};

module.exports = aztec;
