const Web3Service = require('../');
const getNetworkConfig = require('./getNetworkConfig');
const registerContractsInterfaces = require('./registerContractsInterfaces');
const trustedAccount = require('../../../utils/signer/trustedAccount');


class Web3Factory {
    constructor() {
        this.instances = {};
    }

    ensureInstance(networkId) {
        if (this.instances[networkId]) return;
        const instance = new Web3Service();

        const account = trustedAccount(networkId);
        const network = getNetworkConfig(networkId);
        instance.init({
            providerURL: network.infuraProviderUrl,
            account,
        });
        registerContractsInterfaces(instance);

        this.instances[networkId] = instance;
    }

    getWeb3Service(networkId) {
        this.ensureInstance(networkId);
        return this.instances[networkId];
    }
}

module.exports = new Web3Factory();
