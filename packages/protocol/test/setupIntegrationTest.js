/* global web3 */
const { getContractAddressesForNetwork, NetworkId: networkIDs } = require('@aztec/contract-addresses');
const contractArtifacts = require('@aztec/contract-artifacts');
const TruffleContract = require('@truffle/contract');

class setupIntegrationTest {
    /**
     * Sets up the environment for an integration test. Specifically, it creates Truffle Contract instances
     * from the aztec contract-artifacts; at the appropriate address in the contract-addresses package.
     *
     * Can be used to setup a local development testing environment for an integration test
     *
     * @param {String[]} contractsToDeploy - array of the names of contracts to deploy
     * @param {String} NETWORK - ID of the network integration test setup for
     */
    constructor(contractsToDeploy, NETWORK) {
        this.NETWORK = NETWORK;
        this.networkId = networkIDs[NETWORK];
        this.contractsToDeploy = contractsToDeploy;

        this.getAddresses();
        this.getTruffleContracts();
        this.getContracts();
    }

    /**
     * @method getAddresses() - get the addresses for the desired contracts to deploy
     */
    getAddresses() {
        const allContractAddresses = getContractAddressesForNetwork(this.networkId);
        this.contractAddresses = setup.contractsToDeploy.map((desiredContract) => {
            if (Object.keys(allContractAddresses).includes(desiredContract)) {
                return allContractAddresses[desiredContract];
            }
        });
    }

    /**
     * @method getTruffleContracts() - get the Truffle artifacts for desired contracts, with the provider set
     */
    getTruffleContracts() {
        this.contractInstances = setup.contractsToDeploy.map((desiredContract) => {
            return TruffleContract({ abi: contractArtifacts[desiredContract].abi });
        });

        // Set providers on contracts
        const provider = web3.currentProvider;
        Object.keys(this.contractInstances).forEach((contract) => this.contractInstances[contract].setProvider(provider));
    }

    /**
     * @method getContracts() - get the JavaScript objects representing contracts deployed at a specific address, for use
     * in testing
     * @returns Object containing the desired contracts
     */
    async getContracts() {
        const contractInstances = setup.getTruffleContracts();
        const contractAddresses = setup.getAddresses();

        this.contracts = await Promise.all(
            Object.keys(contractInstances).map((contractInstance, index) => {
                return contractInstances[contractInstance].at(contractAddresses[index]);
            }),
        );
    }
}

module.exports = setupIntegrationTest;
