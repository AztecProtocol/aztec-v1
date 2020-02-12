/* eslint-disable func-names */
/* global web3 */
const { getContractAddressesForNetwork, NetworkId: networkIDs } = require('@aztec/contract-addresses');
const contractArtifacts = require('@aztec/contract-artifacts');
const {
    constants: { ERC20_SCALING_FACTOR },
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
     * @param {String} accounts - Ethereum addresses to be used in the test
     * @param {Object} config - optional config, used to modify the test environment setup
     */
    constructor(accounts, config) {
        this.initialiseConfig(config);

        this.NETWORK = this.config.NETWORK;
        const networks = ['ropsten', 'rinkeby', 'kovan', 'mainnet'];

        if (networks.includes(this.NETWORK)) {
            console.log('configuring integration test for', this.NETWORK, 'network');

            const [sender, delegatedAddress] = accounts;
            const publicOwner = sender;
            const opts = { from: sender };

            this.accounts = accounts;
            this.delegatedAddress = delegatedAddress;
            this.opts = opts;
            this.provider = web3.currentProvider;
            this.publicOwner = publicOwner;
            this.sender = sender;

            this.networkId = networkIDs[capitaliseFirstChar(this.NETWORK)];
            this.contractAddresses = this.getAddresses();
            this.contractPromises = this.getContractPromises();
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
    async fundPublicOwnerAccount() {
        const { ACE: ace, ERC20Mintable: erc20 } = await this.allContractObjects;
        const tokensToBeTransferred = this.config.numTestTokens.mul(this.config.scalingFactor);

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
     * @method getAddresses() - get all the deployed contract addresses for a particular network
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
        return this.config.contractsToDeploy.map((nameOfContract) => [nameOfContract, this.getContractPromise(nameOfContract)]);
    }

    /**
     * @method getContractPromise - get an object whose key is the name of a contract, and the value is a function that
     * returns the Truffle representation of the contract
     * @param {string} nameOfContract - name of the contract for which the contract promise should be generated
     * @param {string} address - (optional) address at which the contract should be instantiated. Can be supplied to override the
     * default address used, whereby the default is the address associated with the `nameOfContract`.
     *
     * An example of where `address` will be supplied is when generating a deployed proxy contract. In this case the address will be
     * the address of the proxy, whilst `nameOfContract` will be the behaviour implementation the address is cast with.
     */
    getContractPromise(nameOfContract, address = null) {
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

        const contractAddress = address || extractedContractAddress;
        const truffleRepresentation = this.getTruffleContractRepresentation(extractedContractArtifact);
        return async () => truffleRepresentation.at(contractAddress);
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
     * @method getContracts - generate and get the JavaScript objects representing contracts deployed at a specific address,
     * for use in testing
     * @returns {Object} Truffle contracts, representing the contract deployed at a specific address. The keys are the
     * contract names,
     * the values are the Truffle contract at a particular address
     */
    async getContracts() {
        const allContractObjects = (
            await Promise.all(
                this.contractPromises.map(async (currentContractPromise) => [
                    currentContractPromise[0],
                    await currentContractPromise[1](),
                ]),
            )
        ).reduce((accumulator, currentContractArray) => {
            const [contractName, truffleContract] = currentContractArray;
            accumulator[contractName] = truffleContract;
            return { ...accumulator };
        }, {});

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
        const { sender, publicOwner, delegatedAddress, opts } = this;

        return { sender, publicOwner, delegatedAddress, opts };
    }

    /**
     * @method getProxyAddress - get the Ethereum address of the proxy contract which stores the state for the
     * account registry
     * @returns {String} address of the proxy contract for the relevant network
     */
    getProxyAddress() {
        return this.config.proxyAddresses[this.NETWORK];
    }

    /**
     * @method getProxyContract - get the deployed proxy contract representation, cast with a particular behaviour
     * contract interface/implementation for a specific network
     * @param {String} behaviourName - name of the Behaviour contract whose interface and implementation the proxy will
     * be cast with
     * @returns {Object} Truffle contract representing the proxy contract deployed for a specific network, cast with the
     * specified interface and method implementation
     */
    async getProxyContract(behaviourName) {
        const proxyAddress = this.getProxyAddress();
        const proxyContract = this.getContractPromise(behaviourName, proxyAddress);
        return proxyContract();
    }

    /**
     * @method initialiseConfig - define and set the configuration to be used for the integration test
     * @param {Object} config -  setup the integration test according to the specific scenario and environment the
     * user wishes to test. If not provided, the defaultConfig is used
     */
    initialiseConfig(config) {
        const defaultConfig = {
            /**
             * @param {string[]} contractsToDeploy - Names of the various contracts for which Truffle contracts should be
             * created to represent those contracts deployed on the relevant testNet
             */
            contractsToDeploy: [
                'ACE',
                'AccountRegistryManager',
                'Behaviour20200207',
                'Dividend',
                'ERC20Mintable',
                'FactoryAdjustable201907',
                'JoinSplit',
                'JoinSplitFluid',
                'PrivateRange',
                'PublicRange',
                'Swap',
                'ZkAssetAdjustable',
            ],

            /**
             * @constant {string} NETWORK - name of the test network for which the integration test is to be run.
             * Extracted from the argument passed to the truffle test command - it is the last argument to be passed
             */
            NETWORK: process.argv[process.argv.length - 1],

            /**
             * @constant {BN} numTestTokens - number of ERC20 tokens used during the integration test,
             * and therefore the required minimum balance of the spending account
             */
            numTestTokens: new BN(260),

            /**
             * @param {Bool} runAdjustSupplyTests - boolean determining whether the adjust supply related integration
             * tests should be run. Set to true if so, false if not
             *
             * Currently necessary as the test suite does not yet support same asset repeated minting/burning
             */
            runAdjustSupplyTests: false,

            /**
             * @param {bool} runAccountRegistryTest - boolean determining whether the tests that perform Account Registry
             * related tests should be run. Set to true if so, false if not
             */
            runAccountRegistryTests: true,

            /**
             * @param {bool} runUpgradeTest - boolean determining whether the test that performs a note registry upgrade
             * should be performed. Set to true if so, false if not
             *
             */
            runUpgradeTest: false,

            /**
             * @param {BN} scalingFactor - factor to convert between AZTEC note value and ERC20 token value
             */
            scalingFactor: ERC20_SCALING_FACTOR,

            /**
             * @param {Object} proxyAddresses - addresses of the deployed account registry proxy contracts for each network.
             * Note, these proxy addresses are for the 1.17.0 '@aztec/contract-addresses' package
             */
            proxyAddresses: {
                rinkeby: '0x293B83486Cb24Adf8Cc36497284441FB9e8DB4A1',
                ropsten: '0xb2b550203a2A89C67A8b9eD6B6F86FFF29f718Ae',
                mainnet: '0xe8f0b0ef4ef717f951f113b9ef101a74858bfe7e',
            },
        };

        this.config = Object.assign({}, defaultConfig, config);
    }
}

module.exports = Setup;
