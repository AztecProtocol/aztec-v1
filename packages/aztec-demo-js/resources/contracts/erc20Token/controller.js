/**
 * Exposes an interface to mint erc20 tokens and approve addresses to spend erc20 tokens.  
 *   For test networks we use a dummy token contract where anybody can mint tokens.  
 *   For mainNet, we use the DAI token contract
 *
 * @module erc20Controller
 */

const deployer = require('../../../deployer');

const wallets = require('../../wallets');
const transactions = require('../../transactions');
const config = require('../../../config');
const ERC20Mintable = require('../../../contracts/ERC20Mintable.json');

const { web3 } = deployer;
const { TX_TYPES } = config;

const erc20 = {};

/**
 * Get the ERC20 token's contract address
 * @method getContractAddress
 * @returns {string} the contract address
 */
erc20.getContractAddress = async () => {
    if (config.env === 'MAINNET') {
        return config.daiAddress;
    }
    const networkId = await deployer.getNetwork();
    if (!ERC20Mintable.networks[networkId] || !ERC20Mintable.networks[networkId].address) {
        throw new Error(`ERC20Mintable.sol not deployed to network ${networkId}`);
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
