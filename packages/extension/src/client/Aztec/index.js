import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ApiPermissionService from '~/client/services/ApiPermissionService';

class Aztec {
    constructor() {
        // TODO - assign mock modules that show warnings when calling apis before enabled
        this.web3 = null;
        this.zkAsset = null;
        this.zkNote = null;
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
            if (this[name]) {
                warnLog(`Api '${name}' is already in Aztec.`);
                return;
            }
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
        this.zkAsset = null;
        this.zkNote = null;
        await ConnectionService.disconnect();
    }

    refreshSession = async (config, cb) => {
        await this.disable();
        await this.enable(config, cb);
    }
}

export default Aztec;
