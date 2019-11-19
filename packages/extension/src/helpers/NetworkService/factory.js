import Web3 from 'web3';
import {
    GSNProvider,
} from '@openzeppelin/gsn-provider';
import Web3Service from '~/utils/Web3Service';
import {
    get,
} from '~utils/storage';
import {
    errorLog,
} from '~utils/log';
import approveFunction from '~utils/approveGSNFunction';
import retrieveSigningInfo from './utils/retrieveSigningInfo';


// The goals of the web3 service
// In the background
// 1. return to the developer the correct Web3Instance with contract ABI's and addresses for interacting with the same
// contract as metamask.
// 2. send transactions from the users address TODO replace with GSN.
// 3. provide EVENT apis for syncing
//
//
// The service needs to be initialised with a config for each network. The client scripts should copy contract addresses
// into this config.

class NetworkSwitcher {
    setNetworkConfig({
        networkId,
        currentAddress,
    }) {
        this.networkId = networkId;
        this.currentAddress = currentAddress;
    }

    web3ServicesByNetworks = {};

    networksConfigs = {};

    ensureWeb3Service = async ({
        networkId,
        account = {
            address: this.currentAddress,
        },
    }) => {
        if (!networkId && !this.networkId) {
            this.networkId = await get('networkId');
        }
        const networkIdToUse = networkId || this.networkId;
        const config = this.networksConfigs[networkIdToUse];
        if (!config) {
            const availableIds = Object.keys(this.networksConfigs);
            errorLog(`No network config for such networkId: ${networkIdToUse}, pls select one of: ${JSON.stringify(availableIds)}`);
            return;
        }
        if (this.web3ServicesByNetworks[networkIdToUse]) {
            return;
        }
        const {
            providerUrl,
            contractsConfigs = [],
        } = config;

        const service = new Web3Service();
        let provider;
        if (providerUrl.match(/^wss?:\/\//)) {
            provider = new Web3.providers.WebsocketProvider(providerUrl);
        } else {
            provider = new Web3.providers.HttpProvider(providerUrl);
        }

        const signingInfo = await retrieveSigningInfo(account.address);
        const gsnProvider = new GSNProvider(providerUrl, {
            pollInterval: 15 * 1000,
            signKey: signingInfo.privateKey,
            approveFunction,
            fixedGasPrice: 15e9,
        });

        await service.init({
            provider,
            account,
            gsnConfig: {
                gsnProvider,
                signingInfo,
            },
        });
        for (let i = 0; i < contractsConfigs.length; i += 1) {
            const {
                config: contractConfig,
                address: contractAddress,
            } = contractsConfigs[i];
            if (contractConfig.bytecode === '0x' && !contractAddress) {
                service.registerInterface(contractConfig);
            } else {
                service.registerContract(contractConfig, {
                    address: contractAddress,
                });
            }
        }
        this.web3ServicesByNetworks[networkIdToUse] = service;
    };

    setConfigs(networksConfigs) {
        if (!networksConfigs) {
            errorLog('Config should not be null in Web3ServiceFactory');
            return;
        }

        if (!Array.isArray(networksConfigs)) {
            errorLog('"networksConfigs" should be array of elements');
            return;
        }

        const tempConfig = {};
        for (let i = 0; i < networksConfigs.length; i += 1) {
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

        this.networksConfigs = tempConfig;
    }

    getConfigs() {
        return {
            ...this.networksConfigs,
        };
    }

    async create(options = {}) {
        const {
            networkId,
        } = options;
        await this.ensureWeb3Service(options);
        return this.web3ServicesByNetworks[networkId || this.networkId];
    }
}

export default new NetworkSwitcher();
