/**
 * Exposes an interface to broadcast AZTEC zero-knowledge confidential transactions to an AZTEC token
 *
 * @module aztecTokenController
 */

const web3Utils = require('web3-utils');

const deployer = require('../../../deployer');
const noteController = require('../../notes');
const wallets = require('../../wallets');
const transactions = require('../../transactions');
const { TX_TYPES, NOTE_STATUS } = require('../../../config');

const AZTECERC20Bridge = require('../../../contracts/AZTECERC20Bridge.json');

const { web3 } = deployer;
const { padLeft } = web3Utils;

const aztecToken = {};

/**
 * Get the AZTECERC20Bridge.sol AZTEC token contract address
 * @method getContractAddress
 * @returns {string} the contract address
 */
aztecToken.getContractAddress = async () => {
    const networkId = await deployer.getNetwork();
    if (!AZTECERC20Bridge.networks[networkId] || !AZTECERC20Bridge.networks[networkId].address) {
        throw new Error(`AZTECERC20Bridge.sol not deployed to network ${networkId}`);
    }
    return AZTECERC20Bridge.networks[networkId].address;
};

/**
 * Broadcast a confidentialTransfer zero-knowledge transaction
 * @method updateConfidentialTransferTransaction
 * @param {string} address the AZTEC token contract address
 * @param {string[]} proofData the AZTEC zero-knowledge proof data
 * @param {string} m bytes32 formatted number of input notes
 * @param {string} challenge AZTEC zero-knowledge proof challenge variable
 * @param {string[]} inputSignatures ECDSA signature for each input note
 * @param {string[]} outputOwners Ethereum address of each output note owner
 * @param {string} metadata ephemeral key metadata, used by note owners to recover viewing key
 * @returns {string} the broadcast transaction's transaction hash.
 */
aztecToken.confidentialTransfer = async (address, proofData, m, challenge, inputSignatures, outputOwners, metadata) => {
    const wallet = wallets.get(address);
    const contractAddress = await aztecToken.getContractAddress();
    const aztecTokenContract = new web3.eth.Contract(AZTECERC20Bridge.abi, contractAddress);
    aztecTokenContract.contractAddress = contractAddress;
    const transactionHash = await deployer.methodCall(
        [proofData, m, challenge, inputSignatures, outputOwners, metadata],
        {
            contract: aztecTokenContract,
            method: 'confidentialTransfer',
            wallet,
        }
    );

    // add transaction
    transactions.newTransaction(TX_TYPES.AZTEC_TOKEN_CONFIDENTIAL_TRANSFER, transactionHash);

    return transactionHash;
};

/**
 * Get the mined result of a confidentialTransfer transaction.
 *   Adds the transactionReceipt and transaction objects into the transaction's database entry.
 *   Also updates the status of any notes spent/created
 * @method updateConfidentialTransferTransaction
 * @param {string} transactionHash the transaction hash
 */
aztecToken.updateConfidentialTransferTransaction = async (transactionHash) => {
    const transactionReceipt = await deployer.getTransactionReceipt(transactionHash);

    const transactionData = await deployer.getTransaction(transactionHash);
    // // fish out notes from input data
    const { inputs } = AZTECERC20Bridge.abi.find(v => ((v.name === 'confidentialTransfer') && (v.type === 'function')));
    inputs[inputs.length - 1].name = 'metadata';
    const { notes, m } = web3.eth.abi.decodeParameters(
        inputs,
        `0x${transactionData.input.slice(10)}`
    );
    const inputNoteHashes = notes.slice(0, m).map((note) => {
        const noteString = note.slice(2).reduce((acc, s) => `${acc}${padLeft(s.slice(2), 64)}`, '0x');
        return web3Utils.sha3(noteString, 'hex');
    });
    const outputNoteHashes = notes.slice(m, notes.length).map((note) => {
        const noteString = note.slice(2).reduce((acc, s) => `${acc}${padLeft(s.slice(2), 64)}`, '0x');
        return web3Utils.sha3(noteString, 'hex');
    });

    inputNoteHashes.forEach((noteHash) => { noteController.setNoteStatus(noteHash, NOTE_STATUS.SPENT); });
    outputNoteHashes.forEach((noteHash) => { noteController.setNoteStatus(noteHash, NOTE_STATUS.UNSPENT); });

    transactions.updateMinedTransaction(transactionHash, transactionReceipt, transactionData);
};

/**
 * Get the web3 contract object
 * @method contract
 * @returns {Object} the web3 contract
 */
aztecToken.contract = (contractAddress) => {
    return new web3.eth.Contract(AZTECERC20Bridge.abi, contractAddress);
};

module.exports = aztecToken;
