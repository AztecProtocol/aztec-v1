/**
 * Exposes an interface to mint erc20 tokens and approve addresses to spend erc20 tokens.  
 *   For test networks we use a dummy token contract where anybody can mint tokens.  
 *   For mainNet, we use the DAI token contract
 *
 * @module erc20Controller
 */
const constants = require('@aztec/dev-utils');

const config = require('../../../config');
const deployer = require('../../../deployer');
const transactions = require('../../transactions');
const wallets = require('../../wallets');

const { getContractAddressesForNetwork } = require('@aztec/contract-addresses');
const ERC20Mintable = require('../../../../protocol/build/contracts/ERC20Mintable.json');

const { DAI_ADDRESS } = constants;
const { TX_TYPES } = config;
const { web3 } = deployer;

const erc20 = {};

/**
 * Get the ERC20 token's contract address
 * @method getContractAddress
 * @returns {string} the contract address
 */
erc20.getContractAddress = async () => {
    if (config.env === 'MAINNET') {
        return DAI_ADDRESS;
    }
    const networkId = await deployer.getNetwork();
    let fallback = getContractAddressesForNetwork(networkId).erc20Mintable // Deployed by AZTEC

    if (!ERC20Mintable.networks[networkId] || !ERC20Mintable.networks[networkId].address) {
        if (fallback) {
            return fallback
        } else {
            throw new Error(`ERC20Mintable.sol not deployed to network ${networkId}`);
        }
    }
    return ERC20Mintable.networks[networkId].address;
};

/**
 * Mint tokens. Only works on test nets
 * @method mint
 * @param {string} from address of transaction sender and minter
 * @param {string} to address of the token recipient
 * @param {number} value number of tokens being minted
 * @returns {string} the created transaction's transaction hash
 */
erc20.mint = async (from, to, value) => {
    const contractAddress = await erc20.getContractAddress();

    const fromWallet = wallets.get(from);

    const erc20Contract = new web3.eth.Contract(ERC20Mintable.abi, contractAddress);
    erc20Contract.contractAddress = contractAddress;
    const transactionHash = await deployer.methodCall(
        [to, value],
        {
            contract: erc20Contract,
            method: 'mint',
            wallet: fromWallet,
        }
    );

    // add transaction
    transactions.newTransaction(TX_TYPES.ERC20_MINT, transactionHash);

    return transactionHash;
};

/**
 * Approve an address to spend tokens.
 * @method approve
 * @param {string} from address of token holder
 * @param {string} spender address that token holder is approving
 * @param {number} value number of tokens being approved
 * @returns {string} the created transaction's transaction hash
 */
erc20.approve = async (from, spender, value) => {
    const contractAddress = await erc20.getContractAddress();

    const fromWallet = wallets.get(from);

    const erc20Contract = new web3.eth.Contract(ERC20Mintable.abi, contractAddress);
    erc20Contract.contractAddress = contractAddress;
    const transactionHash = await deployer.methodCall(
        [spender, value],
        {
            contract: erc20Contract,
            method: 'approve',
            wallet: fromWallet,
        }
    );

    // add transaction
    transactions.newTransaction(TX_TYPES.ERC20_APPROVE, transactionHash);

    return transactionHash;
};


/**
 * Get the web3 contract object
 * @method contract
 * @returns {Object} the web3 contract
 */
erc20.contract = (contractAddress) => {
    return new web3.eth.Contract(ERC20Mintable.abi, contractAddress);
};


module.exports = erc20;
