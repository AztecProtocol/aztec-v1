import * as aztec from 'aztec.js';
import {
    warnLog,
} from '~/utils/log';
import Web3Service from '~/client/services/Web3Service';
import ConnectionService from '~/client/services/ConnectionService';
import ApiPermissionService from '~/client/services/ApiPermissionService';

class Aztec {
    constructor() {
        // TODO - assign mock modules that show warnings when calling apis before enabled
        this.web3 = null;
        this.zkAsset = null;
        this.zkNote = null;

        Object.keys(aztec).forEach((name) => {
            if (this[name]) {
                warnLog(`Api '${name}' is already in Aztec.`);
                return;
            }
            this[name] = aztec[name];
        });
    }

    enable = async (options = {}, callback = null) => new Promise(async (resolve, reject) => {
        const {
            apiKey = '',
            providerUrl = '',
            contractAddresses = {
                ACE: '',
                AZTECAccountRegistry: '',
            },
            autoRefreshOnProfileChange = true,
        } = options;
        let networkSwitchedDuringStart = false;

        if (autoRefreshOnProfileChange) {
            Web3Service.bindProfileChange(async () => {
                networkSwitchedDuringStart = true;
                await this.refreshSession(options, (success, error) => {
                    if (callback) {
                        callback(!!error, error);
                    }
                    if (error && !callback) {
                        reject(error);
                    } else {
                        resolve();
                    }
                });
            });
        }

        const networkConfig = await ConnectionService.openConnection({
            apiKey,
            providerUrl,
            contractAddresses,
        });

        if (networkSwitchedDuringStart) {
            // this statement is true if:
            //   - user allows metamask to access current page
            //   - user switches address
            // while opening connection
            return;
        }

        try {
            const {
                networkId,
                contractsConfig,
                error,
            } = networkConfig || {};

            if (error) {
                throw error;
            }

            ApiPermissionService.validateContractConfigs(contractsConfig, networkId);

            await Web3Service.init(networkConfig);

            await ApiPermissionService.ensurePermission();
        } catch (error) {
            if (!networkSwitchedDuringStart) {
                if (callback) {
                    callback(false, error);
                    resolve();
                } else {
                    reject(error);
                }
            }
            return;
        }

        if (networkSwitchedDuringStart) {
            // resolve has been pass to another enable() and should be triggered there
            return;
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
            Web3Service.bindProfileChange(async () => this.refreshSession(options));
        }

        if (callback) {
            callback(true, null);
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
        return this.enable(config, cb);
    }
}

export default Aztec;
