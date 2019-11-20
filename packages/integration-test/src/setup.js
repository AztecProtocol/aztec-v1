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

        if (NETWORK !== '1' || NETWORK !== '3' || NETWORK !== '4' || NETWORK !== '42') {
            this.getLocalAddresses();
            this.getLocalTruffleContracts();
        } else {
            this.networkId = networkIDs[NETWORK];
            this.getAddresses();
            this.getTruffleContracts();
        }
    }

    /**
     * @method getAddresses() - get the addresses for the desired contracts to deploy
     */
    getAddresses() {
        const allContractAddresses = getContractAddressesForNetwork(this.networkId);
        this.contractAddresses = this.contractsToDeploy.map((desiredContract) => {
            if (Object.keys(allContractAddresses).includes(desiredContract)) {
                return allContractAddresses[desiredContract];
            }
        });
    }

    /**
     * @method getLocalAddresses() - get the addresses of locally deployed contracts
     */
    getLocalAddresses() {
        // const aceAddress = require('../../build/')
    }

    /**
     * @method getTruffleContracts() - get the Truffle artifacts for desired contracts, with the provider set
     */
    getTruffleContracts() {
        this.contractInstances = this.contractsToDeploy.map((desiredContract) => {
            return TruffleContract(contractArtifacts[desiredContract]);
        });

        // Set providers on contracts
        const provider = web3.currentProvider;
        Object.keys(this.contractInstances).forEach((contract) => this.contractInstances[contract].setProvider(provider));
    }

    /**
     * @method getLocalTruffleContracts - get the Truffle artifacts for desired locally deployed contracts
     */
    getLocalTruffleContracts() {}

    /**
     * @method getContracts() - get the JavaScript objects representing contracts deployed at a specific address, for use
     * in testing
     * @returns Object containing the desired contracts
     */
    async getContracts() {
        this.contracts = await Promise.all(
            Object.keys(this.contractInstances).map((contractInstance, index) => {
                return this.contractInstances[contractInstance].at(this.contractAddresses[index]);
            }),
        );
    }

    // {
    //     "ACE": async function () {
    //         return aceTruffleRepresentation.at()
    //     }
    // }
}

module.exports = Setup;
