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
     * @param {String[]} contractsToDeploy - array of the names of contracts to deploy
     * @param {String} NETWORK - ID of the network to set the integration test up for.
     *                           If deploying and testing locally, this will typically be a
     *                           large number.
     */
    constructor(config, accounts) {
        this.NETWORK = config.NETWORK;
        this.contractsToDeploy = config.contractsToDeploy;
        this.provider = web3.currentProvider;
        this.accounts = accounts;
        this.config = config;
        this.runAdjustSupplyTests = config.runAdjustSupplyTests;

        const testNetworks = ['ropsten', 'rinkeby', 'kovan'];

        if (testNetworks.includes(this.NETWORK)) {
            console.log('Configuring integration test for', this.NETWORK, 'network');
            this.networkId = networkIDs[capitaliseFirstChar(this.NETWORK)];
            this.getAddresses();
            this.getContractPromises();

            this.getTransactionTestingAddresses();
        } else {
            throw new AztecError(codes.UNSUPPORTED_NETWORK, {
                message: 'Network not recognised, please input: `ropsten`, `rinkeby` or `kovan`',
                inputNetwork: this.NETWORK,
            });
        }
    }

    /**
     * @method getAddresses() - get the addresses for the desired contracts to deploy
     */
    getAddresses() {
        this.contractAddresses = getContractAddressesForNetwork(this.networkId);
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
        contractObject[nameOfContract] = async () => {
            const truffleRepresentation = this.getTruffleContractRepresentation(contractArtifacts[nameOfContract]);
            return truffleRepresentation.at(this.contractAddresses[nameOfContract]);
        };
        return contractObject;
    }

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
        const contractObject = this.contractPromises.reduce(
            async (previousPromiseAccumulator, currentContractPromise, currentIndex) => {
                const accumulator = await previousPromiseAccumulator;
                const deployedContract = await currentContractPromise[this.contractsToDeploy[currentIndex]]();
                accumulator[this.contractsToDeploy[currentIndex]] = deployedContract;
                return { ...accumulator };
            },
            {},
        );

        this.contractObject = contractObject;
        return contractObject;
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
     * @method fundPublicOwnerAccount - fund the publicOwner account with ERC20 tokens if required
     *
     * @param scalingFactor - factor to convert between AZTEC note value and ERC20 token value
     *
     */
    async fundPublicOwnerAccount(scalingFactor) {
        const { ACE: ace, ERC20Mintable: erc20 } = await this.contractObject;

        const publicOwnerBalance = await erc20.balanceOf(this.publicOwner);
        if (publicOwnerBalance < this.config.numTestTokens.mul(scalingFactor)) {
            console.log('inside if statement');
            const tokensTransferred = new BN(this.config.numTestTokens);
            await erc20.mint(this.publicOwner, scalingFactor.mul(tokensTransferred), this.opts);
            await erc20.approve(ace.address, scalingFactor.mul(tokensTransferred), this.opts);
        }
    }
}

module.exports = Setup;
