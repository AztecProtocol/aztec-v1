import EventListeners from '~/utils/EventListeners';
import Web3Service from '~/client/services/Web3Service';
import ApiPermissionService from '~/client/services/ApiPermissionService';
import ConnectionService from '~/client/services/ConnectionService';

export default class ApiManager {
    constructor() {
        this.eventListeners = new EventListeners(['profileChanged']);
    }

    enable = async (
        options = {},
        callback = null,
        setApis,
    ) => new Promise(async (resolve, reject) => {
        const {
            apiKey = '',
            providerUrl = '',
            contractAddresses = {
                ACE: '',
                AccountRegistry: '',
                AccountRegistryManager: '',
            },
            autoRefreshOnProfileChange = true,
        } = options;
        let networkSwitchedDuringStart = false;

        const doResolved = (shouldReject = false, error = null) => {
            if (!networkSwitchedDuringStart) {
                this.eventListeners.notify(
                    'profileChanged',
                    'aztecAccountChanged',
                    !shouldReject && !error,
                    error,
                );
            }

            if (!shouldReject) {
                resolve(!!error);
            } else if (!callback) {
                reject(error);
            }
        };

        if (autoRefreshOnProfileChange) {
            Web3Service.bindProfileChange((changedType, newTypeValue) => {
                networkSwitchedDuringStart = true;

                this.eventListeners.notify('profileChanged', changedType, newTypeValue);

                this.refreshSession(options, (success, error) => {
                    if (callback) {
                        callback(!error, error);
                    }
                    const shouldReject = !!error && !callback;
                    doResolved(shouldReject, error);
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
                }
                const shouldReject = !callback;
                doResolved(shouldReject, error);
            }
            return;
        }

        if (networkSwitchedDuringStart) {
            // resolve has been pass to another enable() and should be triggered there
            return;
        }

        const apis = ApiPermissionService.generateApis();
        setApis(apis);

        if (autoRefreshOnProfileChange) {
            Web3Service.bindProfileChange((changedType, newTypeValue) => {
                this.eventListeners.notify('profileChanged', changedType, newTypeValue);

                this.refreshSession(options, (success, error) => {
                    this.eventListeners.notify(
                        'profileChanged',
                        'aztecAccountChanged',
                        success,
                        error,
                    );
                });
            });
        }

        if (callback) {
            callback(true, null);
        }

        doResolved();
    });

    async disable() {
        this.eventListeners.removeAll('profileChanged');
        await ConnectionService.disconnect();
    }

    refreshSession = async (options, cb) => {
        await this.disable();
        return this.enable(options, cb);
    }
}
