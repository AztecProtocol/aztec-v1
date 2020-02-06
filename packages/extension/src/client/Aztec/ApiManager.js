import EventListeners from '~/utils/EventListeners';
import Web3Service from '~/client/services/Web3Service';
import ApiPermissionService from '~/client/services/ApiPermissionService';
import ConnectionService from '~/client/services/ConnectionService';

export default class ApiManager {
    constructor() {
        this.eventListeners = new EventListeners(['profileChanged']);
        this.enableProfileChangeListener = null;

        Web3Service.bindProfileChange((changedType, newTypeValue) => {
            this.eventListeners.notify('profileChanged', changedType, newTypeValue);
        });
    }

    generateDefaultApis() { // eslint-disable-line class-methods-use-this
        return ApiPermissionService.generateApis();
    }

    bindProfileChangeListenerOnce(cb) {
        Web3Service.unbindProfileChange(this.enableProfileChangeListener);
        const listener = (changedType, newTypeValue) => {
            this.unbindProfileChangeListener();
            cb(changedType, newTypeValue);
        };
        this.enableProfileChangeListener = listener;
        Web3Service.bindProfileChange(this.enableProfileChangeListener);
    }

    unbindProfileChangeListener() {
        if (this.enableProfileChangeListener) {
            Web3Service.unbindProfileChange(this.enableProfileChangeListener);
            this.enableProfileChangeListener = null;
        }
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
            this.bindProfileChangeListenerOnce(() => {
                networkSwitchedDuringStart = true;

                this.refreshSession(options, (success, error) => {
                    if (callback) {
                        callback(!error, error);
                    }
                    const shouldReject = !!error && !callback;
                    doResolved(shouldReject, error);
                }, setApis);
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

        const apis = ApiPermissionService.generateApis(true);
        setApis(apis);

        if (autoRefreshOnProfileChange) {
            this.bindProfileChangeListenerOnce(() => {
                this.refreshSession(options, null, setApis);
            });
        }

        if (callback) {
            callback(true, null);
        }

        doResolved();
    });

    async disable(setApis) {
        this.unbindProfileChangeListener();

        const apis = this.generateDefaultApis();
        setApis(apis);

        await ConnectionService.disconnect();
    }

    async refreshSession(options, cb, setApis) {
        await this.disable(setApis);
        return this.enable(options, cb, setApis);
    }
}
