import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ApiPermissionService from '~/client/services/ApiPermissionService';

class Aztec {
    constructor() {
        // TODO - assign mock modules that show warnings when calling apis before enabled
        this.web3 = null;
        this.asset = {};
        this.note = {};
    }

    enable = async (
        {
            apiKey = '',
            providerUrl = '',
            contractAddresses = {
                ACE: '',
                AZTECAccountRegistry: '',
            },
            autoRefreshOnProfileChange = true,
        } = {},
        callback = null,
    ) => new Promise(async (resolve, reject) => {
        if (autoRefreshOnProfileChange) {
            Web3Service.bindProfileChange(async () => this.refreshSession(
                {
                    apiKey,
                    providerUrl,
                    contractAddresses,
                },
                resolve,
            ));
        }

        const networkConfig = await ConnectionService.openConnection({
            apiKey,
            providerUrl,
            contractAddresses,
        });

        try {
            const {
                networkId,
                contractsConfig,
            } = networkConfig;
            ApiPermissionService.validateContractConfigs(contractsConfig, networkId);

            await Web3Service.init(networkConfig);

            await ApiPermissionService.ensurePermission();
        } catch (error) {
            reject(error);
        }

        const apis = ApiPermissionService.generateApis();
        Object.keys(apis).forEach((name) => {
            this[name] = apis[name];
        });

        if (autoRefreshOnProfileChange) {
            Web3Service.bindProfileChange(async () => this.refreshSession({
                apiKey,
                providerUrl,
                contractAddresses,
            }));
        }

        if (callback) {
            callback();
        }

        resolve();
    });

    async disable() {
        this.web3 = null;
        this.asset = {};
        this.note = {};
        await ConnectionService.disconnect();
    }

    refreshSession = async (config, cb) => {
        await this.disable();
        await this.enable(config, cb);
    }
}

export default Aztec;
