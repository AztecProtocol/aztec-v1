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

    enable = async ({
        provider = null,
        providerUrl = '',
        contractAddresses = {
            ACE: '',
            AZTECAccountRegistry: '',
        },
    } = {}) => {
        await Web3Service.init({
            provider,
            providerUrl,
        });

        Web3Service.bindProfileChange(this.refreshSession);

        return new Promise(async (resolve) => {
            const {
                contractsConfigs,
            } = await ConnectionService.openConnection({
                providerUrl,
                contractAddresses,
            });

            await ApiPermissionService.ensurePermission();

            const apis = ApiPermissionService.generateApis({
                contractsConfigs,
            });
            Object.keys(apis).forEach((name) => {
                this[name] = apis[name];
            });

            resolve();
        });
    };

    async disable() {
        this.web3 = null;
        this.asset = {};
        this.note = {};
        await ConnectionService.disconnect();
    }

    refreshSession = async () => {
        await this.disable();
        await this.enable();
    }
}

export default Aztec;
