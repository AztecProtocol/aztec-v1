/* eslint-disable func-names */
/* global web3 */
const { getContractAddressesForNetwork, NetworkId: networkIDs } = require('@aztec/contract-addresses');
const contractArtifacts = require('@aztec/contract-artifacts');
const {
    errors: { codes, AztecError },
} = require('@aztec/dev-utils');
const BN = require('bn.js');
const TruffleContract = require('@truffle/contract');

const { capitaliseFirstChar } = require('./utils');

class Setup {
    /**
     * Sets up the environment for an integration test. Specifically, it creates Truffle Contract instances
     * from the aztec contract-artifacts; at the appropriate address in the contract-addresses package.
     *
     * Can be used to setup a local development testing environment for an integration test
     *
     * @param {Object} config - config used to modify the test environment setup
     * @param {String} accounts - Ethereum addresses to be used in the test
     */
    constructor(config, accounts) {
        this.config = config;
        this.NETWORK = config.NETWORK;
        this.runAdjustSupplyTests = config.runAdjustSupplyTests;
        this.contractsToDeploy = config.contractsToDeploy;

        this.provider = web3.currentProvider;
        this.accounts = accounts;

        const networks = ['ropsten', 'rinkeby', 'kovan', 'mainnet'];
        if (networks.includes(this.NETWORK)) {
            console.log('Configuring integration test for', this.NETWORK, 'network');
            this.networkId = networkIDs[capitaliseFirstChar(this.NETWORK)];
            this.getAddresses();
            this.getContractPromises();

            this.getTransactionTestingAddresses();
        } else {
            throw new AztecError(codes.UNSUPPORTED_NETWORK, {
                message: 'Network not recognised, please input: `ropsten`, `rinkeby`, `kovan` or `mainnet`',
                inputNetwork: this.NETWORK,
            });
        }
    }

    /**
     * @method getAddresses() - get the addresses for the desired contracts to deploy
     */
    getAddresses() {
        try {
            this.contractAddresses = getContractAddressesForNetwork(this.networkId);
        } catch (err) {
            throw new AztecError(codes.NO_CONTRACT_ADDRESSES, {
                message: 'No contract addresses exist for the given network ID in @aztec/contract-addresses',
                networkId: this.networkId,
            });
        }
    }

    /**
     * @method getContractPromises - get the Truffle contracts for desired contracts, with the provider set
     */
    getContractPromises() {
        this.contractPromises = this.contractsToDeploy.map((nameOfContract) => this.getContractPromise(nameOfContract));
    }

    /**
     * @method getContractPromise - get an object whose key is the name of a contract, and the value is a function that
     * returns the Truffle representation of the contract
     * @param {string} nameOfContract
     */
    getContractPromise(nameOfContract) {
        const contractObject = {};
        let extractedContractArtifact;
        let extractedContractAddress;

        try {
            extractedContractArtifact = contractArtifacts[nameOfContract];
        } catch (err) {
            throw new AztecError(codes.NO_CONTRACT_ARTIFACT, {
                message: 'Requested contract does not exist in @aztec/contract-artifacts',
                requestedContract: nameOfContract,
            });
        }

        try {
            extractedContractAddress = this.contractAddresses[nameOfContract];
        } catch (err) {
            throw new AztecError(codes.NO_CONTRACT_ADDRESS, {
                message: 'Requested contract does not have a deployed address in @aztec/contract-addresses',
                requestedContract: nameOfContract,
            });
        }

        contractObject[nameOfContract] = async () => {
            const truffleRepresentation = this.getTruffleContractRepresentation(extractedContractArtifact);
            return truffleRepresentation.at(extractedContractAddress);
        };
        return contractObject;
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
     * @method getContracts - get the JavaScript objects representing contracts deployed at a specific address, for use
     * in testing
     * @returns {Object} Truffle contracts, representing the contract deployed at a specific address
     */
    async getContracts() {
        const allContractObjects = this.contractPromises.reduce(
            async (previousPromiseAccumulator, currentContractPromise, currentIndex) => {
                const accumulator = await previousPromiseAccumulator;
                const deployedContract = await currentContractPromise[this.contractsToDeploy[currentIndex]]();
                accumulator[this.contractsToDeploy[currentIndex]] = deployedContract;
                return { ...accumulator };
            },
            {},
        );

        this.allContractObjects = allContractObjects;
        return allContractObjects;
    }

    /**
     * @method getTransactionTestingAddresses - get the Ethereum addresses representing key transaction addresses in tests,
     * such as sender, publicOwner and delegatedAddress
     *
     * @returns {Object} sender, publicOwner, delegatedAddress, opts variables
     */
    getTransactionTestingAddresses() {
        const [sender, delegatedAddress] = this.accounts;
        const publicOwner = sender;
        const opts = { from: sender };
        this.publicOwner = publicOwner;
        this.opts = opts;

        return { sender, publicOwner, delegatedAddress, opts };
    }

    /**
     * @method fundPublicOwnerAccount - fund the publicOwner account with ERC20 tokens, if the balance is less
     * than the number required for the test suite to run.
     *
     * Num of tokens required for test suite to run given by numTestTokens on the config object.
     *
     * @param scalingFactor - factor to convert between AZTEC note value and ERC20 token value
     *
     */
    async fundPublicOwnerAccount(scalingFactor) {
        const { ACE: ace, ERC20Mintable: erc20 } = await this.allContractObjects;

        const publicOwnerBalance = await erc20.balanceOf(this.publicOwner);
        if (publicOwnerBalance < this.config.numTestTokens.mul(scalingFactor)) {
            const tokensTransferred = new BN(this.config.numTestTokens);
            await erc20.mint(this.publicOwner, scalingFactor.mul(tokensTransferred), this.opts);
            await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), this.opts);
        }
    }
}

module.exports = Setup;
