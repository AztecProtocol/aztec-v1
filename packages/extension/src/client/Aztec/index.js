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
            provider = null,
            providerUrl = '',
            contractAddresses = {
                ACE: '',
                AZTECAccountRegistry: '',
            },
            autoRefreshOnProfileChange = true,
        } = {},
        callback = null,
    ) => {
        await Web3Service.init({
            provider,
            providerUrl,
        });

        return new Promise(async (resolve) => {
            if (autoRefreshOnProfileChange) {
                Web3Service.bindProfileChange(async () => this.refreshSession(
                    {
                        provider,
                        providerUrl,
                        contractAddresses,
                    },
                    resolve,
                ));
            }

            const {
                contractsConfigs,
            } = await ConnectionService.openConnection({
                providerUrl,
                contractAddresses,
            });

            ApiPermissionService.setContractConfigs(contractsConfigs);

            await ApiPermissionService.ensurePermission();

            const apis = ApiPermissionService.generateApis();
            Object.keys(apis).forEach((name) => {
                this[name] = apis[name];
            });

            if (autoRefreshOnProfileChange) {
                Web3Service.bindProfileChange(async () => this.refreshSession({
                    provider,
                    providerUrl,
                    contractAddresses,
                }));
            }

            if (callback) {
                callback();
            }

            resolve();
        });
    };

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
