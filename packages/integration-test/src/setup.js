/* eslint-disable func-names */
/* global web3 */
const { getContractAddressesForNetwork, NetworkId: networkIDs } = require('@aztec/contract-addresses');
const contractArtifacts = require('@aztec/contract-artifacts');
const TruffleContract = require('@truffle/contract');

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
    constructor(contractsToDeploy, NETWORK) {
        this.NETWORK = NETWORK;
        this.contractsToDeploy = contractsToDeploy;
        this.provider = web3.currentProvider;

        const testNetworks = ['Ropsten', 'Rinkeby', 'Kovan'];

        if (testNetworks.includes(NETWORK)) {
            console.log('Configuring integration test for', NETWORK, 'network');
            this.networkId = networkIDs[NETWORK];
            this.getAddresses();
            this.getContractPromises();
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
     * @method getContracts() - get the JavaScript objects representing contracts deployed at a specific address, for use
     * in testing
     * @returns Object containing the desired contracts
     */
    async getContracts() {
        const contractObject = this.contractPromises.reduce(async (previousPromiseAccumulator, currentContractPromise, currentIndex) => {
            const accumulator = await previousPromiseAccumulator;
            const deployedContract = await currentContractPromise[this.contractsToDeploy[currentIndex]]();
            accumulator[this.contractsToDeploy[currentIndex]] = deployedContract;
            return { ...accumulator };
        }, {});

        return contractObject;
    }
}

module.exports = Setup;
