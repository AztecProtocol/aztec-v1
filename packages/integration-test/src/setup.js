/* eslint-disable func-names */
/* global web3 */
const { getContractAddressesForNetwork, NetworkId: networkIDs } = require('@aztec/contract-addresses');
const contractArtifacts = require('@aztec/contract-artifacts');
const {
    errors: { codes, AztecError },
} = require('@aztec/dev-utils');
const TruffleContract = require('@truffle/contract');

const { capitaliseFirstChar } = require('./utils');

class Setup {
    /**
     * Sets up the environment for an integration test. Specifically, it creates Truffle Contract instances
     * from the aztec contract-artifacts; at the appropriate address in the contract-addresses package.
     *
     * Can be used to setup a local development testing environment for an integration test
     *
     * @param {Object} conig - config used to modify the test environment setup
     * @param {String} accounts - Ethereum addresses to be used in the test
     */
    constructor(accounts, config) {
        // this.initialiseConfig(config);

        this.NETWORK = config.NETWORK;
        const networks = ['ropsten', 'rinkeby', 'kovan', 'mainnet'];

        if (networks.includes(this.NETWORK)) {
            console.log('configuring integration test for', this.NETWORK, 'network');

            const [sender, delegatedAddress] = accounts;
            const publicOwner = sender;
            const opts = { from: sender };

            this.accounts = accounts;
            this.config = config;
            this.contractsToDeploy = config.contractsToDeploy;
            this.delegatedAddress = delegatedAddress;
            this.opts = opts;
            this.provider = web3.currentProvider;
            this.publicOwner = publicOwner;
            this.runAdjustSupplyTests = config.runAdjustSupplyTests;
            this.runUpgrade = config.runUpgrade;
            this.sender = sender;

            this.networkId = networkIDs[capitaliseFirstChar(this.NETWORK)];
            this.contractAddresses = this.getAddresses();
            this.contractPromises = this.getContractPromises();
            this.allContractObjects = this.generateContracts();
        } else {
            throw new AztecError(codes.UNSUPPORTED_NETWORK, {
                message: 'Network not recognised, please input: `ropsten`, `rinkeby`, `kovan` or `mainnet`',
                inputNetwork: this.NETWORK,
            });
        }
    }

    /**
     * @method fundPublicOwnerAccount - fund the publicOwner account with ERC20 tokens, if the balance is less
     * than the number required for the test suite to run. Approve ACE to spend the relevant number of tokens
     *
     * Num of tokens required for test suite to run given by numTestTokens on the config object.
     *
     * @param scalingFactor - factor to convert between AZTEC note value and ERC20 token value
     *
     */
    async fundPublicOwnerAccount(scalingFactor) {
        const { ACE: ace, ERC20Mintable: erc20 } = await this.allContractObjects;
        const tokensToBeTransferred = this.config.numTestTokens.mul(scalingFactor);

        // mint tokens
        const publicOwnerBalance = await erc20.balanceOf(this.publicOwner);
        if (publicOwnerBalance.lt(tokensToBeTransferred)) {
            await erc20.mint(this.publicOwner, tokensToBeTransferred, this.opts);
        }

        // approve tokens
        const publicOwnerApproval = await erc20.allowance(this.publicOwner, ace.address);
        if (publicOwnerApproval.lt(tokensToBeTransferred)) {
            await erc20.approve(ace.address, tokensToBeTransferred, this.opts);
        }
    }

    /**
     * @method getAddresses() - get the addresses for the desired contracts to deploy
     */
    getAddresses() {
        const contractAddresses = getContractAddressesForNetwork(this.networkId);

        if (contractAddresses === undefined) {
            throw new AztecError(codes.NO_CONTRACT_ADDRESSES, {
                message: 'No contract addresses exist for the given network ID in @aztec/contract-addresses',
                networkId: this.networkId,
            });
        }
        return contractAddresses;
    }

    /**
     * @method getContractPromises - get the Truffle contracts for desired contracts, with the provider set
     * @returns {Array} - returns an array of array. Each inner array is associated with one particular contract, the
     * first index being the name of the contract and the second element the promise representing the truffle contract
     */
    getContractPromises() {
        return this.contractsToDeploy.map((nameOfContract) => [nameOfContract, this.getContractPromise(nameOfContract)]);
    }

    /**
     * @method getContractPromise - get an object whose key is the name of a contract, and the value is a function that
     * returns the Truffle representation of the contract
     * @param {string} nameOfContract
     */
    getContractPromise(nameOfContract) {
        const extractedContractArtifact = contractArtifacts[nameOfContract];
        if (extractedContractArtifact === undefined) {
            throw new AztecError(codes.NO_CONTRACT_ARTIFACT, {
                message: 'Requested contract does not exist in @aztec/contract-artifacts',
                requestedContract: nameOfContract,
            });
        }

        const extractedContractAddress = this.contractAddresses[nameOfContract];
        if (extractedContractAddress === undefined) {
            throw new AztecError(codes.NO_CONTRACT_ADDRESS, {
                message: 'Requested contract does not have a deployed address in @aztec/contract-addresses',
                requestedContract: nameOfContract,
            });
        }

        const truffleRepresentation = this.getTruffleContractRepresentation(extractedContractArtifact);
        return truffleRepresentation.at(extractedContractAddress); // this is going to return a promise
    }

    /**
     * @method getTruffleContractRepresentation - get the Truffle contract representation of a contract, for a specific
     * abi, bytecode and provider
     * @param {Object} contractArtifact - truffle artifact for which the Truffle contract wrapper should be generated
     */
    getTruffleContractRepresentation(contractArtifact) {
        const truffleRepresentation = TruffleContract({ abi: contractArtifact.abi, bytecode: contractArtifact.bytecode });
        truffleRepresentation.setProvider(this.provider);
        return truffleRepresentation;
    }

    /**
     * @method generateContracts - generate the JavaScript objects representing contracts deployed at a specific address, for use
     * in testing
     * @returns {Object} Truffle contracts, representing the contract deployed at a specific address. The keys are the contract names,
     * the values are the Truffle contract at a particular address
     */
    async generateContracts() {
        const allContractObjects = (await Promise.all(
            this.contractPromises.map(async (currentContractPromise) => Promise.all(currentContractPromise)),
        )).reduce((accumulator, currentContractArray) => {
            const [contractName, truffleContract] = currentContractArray;
            accumulator[contractName] = truffleContract;
            return { ...accumulator };
        }, {});

        this.allContractObjects = allContractObjects;
        return allContractObjects;
    }

    /**
     * @method getContracts - get the JavaScript objects representing contracta deployed at a specific address
     * @returns {Object} - Truffle contracts, representing the contract deployed at a specific address
     */
    getContracts() {
        return this.allContractObjects;
    }

    /**
     * @method getTransactionTestingAddresses - get the Ethereum addresses representing key transaction addresses in tests,
     * such as sender, publicOwner and delegatedAddress
     *
     * @returns {Object} sender, publicOwner, delegatedAddress, opts variables
     */
    getTransactionTestingAddresses() {
        const { sender, publicOwner, delegatedAddress, opts } = this;

        return { sender, publicOwner, delegatedAddress, opts };
    }

    // /**
    //  * @method initialiseConfig -
    //  * @returns
    //  */
    // initialiseConfig(config) {
    //     const defaultConfig {

    //     }
    // }
}

module.exports = Setup;
