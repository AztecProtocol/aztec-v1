import Web3 from 'web3';
import {
    Web3Service
 } from './';
import {
    errorLog,
} from '~utils/log';


class Web3ServiceFactory {

    _web3ServicesByNetworks = {};
    _networksConfigs = {};

    _ensureWeb3Service = (networkId) => {
        const config = this._networksConfigs[networkId];
        if (!config) {
            errorLog(`No network config for such networkId: ${networkId}`);
            return;
        }
        if (this._web3ServicesByNetworks[networkId]) {
            return;
        }
        const {
            providerUrl,
            contractsConfigs = [],
        } = config;

        const service = new Web3Service();
        const provider = new Web3.providers.HttpProvider(providerUrl)
        service.init({
            provider,
        });
        for (let i = 0; i < contractsConfigs.length; i++) {
            const config = contractsConfigs[i];
            service.registerContract(config);
        }
        this._web3ServicesByNetworks[networkId] = service;
    };

    setConfigs(networksConfigs) {
        if (!networksConfigs) {
            errorLog('Config shoulnot be null in Web3ServiceFactory');
            return;
        }

        if (!Array.isArray(networksConfigs)) {
            errorLog('"networksConfigs" should be array of elements');
            return;
        }

        const tempConfig = {};
        for (let i = 0; i < networksConfigs.length; i++) {
            const {
                title,
                networkId,
                providerUrl,
            } = networksConfigs[i];
            
            if (!title || (!networkId && networkId !== 0) || !providerUrl) {
                errorLog(`Network Config must consist of title, networkId and providerUrl fields. Was provided: ${JSON.stringify(networksConfigs[i])}`);
                return;
            }

            tempConfig[networkId] = networksConfigs[i];
        }

        this._networksConfigs = tempConfig;
    }

    getConfigs() {
        return {
            ...this._networksConfigs,
        };
    }

    create(networkId) {
        this._ensureWeb3Service(networkId);
        return this._web3ServicesByNetworks[networkId];
    }

}

export default new Web3ServiceFactory();