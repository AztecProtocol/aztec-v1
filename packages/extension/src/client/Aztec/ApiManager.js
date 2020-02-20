import isEqual from 'lodash/isEqual';
import asyncForEach from '~/utils/asyncForEach';
import {
    getNetworkName,
} from '~/utils/network';
import EventListeners from '~/utils/EventListeners';
import Web3Service from '~/client/services/Web3Service';
import ApiPermissionService from '~/client/services/ApiPermissionService';
import ConnectionService from '~/client/services/ConnectionService';

export default class ApiManager {
    constructor() {
        this.setApis = () => {};
        this.eventListeners = new EventListeners(['profileChanged']);
        this.oneTimeProfileChangeListener = null;
        this.autoRefreshOnProfileChange = true;
        this.currentOptions = null;
        this.aztecAccount = null;
        this.error = null;
        this.sessionPromise = null;
        this.enableListenersMapping = {};

        ConnectionService.init();

        Web3Service.bindProfileChange((changedType, newTypeValue) => {
            let objValue = newTypeValue || null;
            if (objValue) {
                switch (changedType) {
                    case 'accountChanged':
                        objValue = {
                            address: newTypeValue,
                        };
                        break;
                    case 'networkChanged':
                    case 'chainChanged':
                        if (newTypeValue === 'loading') {
                            objValue = null;
                        } else {
                            objValue = {
                                id: newTypeValue,
                                name: getNetworkName(newTypeValue),
                            };
                        }
                        break;
                    default:
                }
            }

            if (!this.autoRefreshOnProfileChange) {
                this.disable();
            } else if (!this.aztecAccount && !this.sessionPromise) {
                this.generateDefaultApis();
            }

            this.eventListeners.notify('profileChanged', changedType, objValue);
        });
    }

    async generateDefaultApis() {
        const apis = await ApiPermissionService.generateApis();
        this.setApis(apis);
    }

    bindOneTimeProfileChangeListener(cb) {
        Web3Service.unbindProfileChange(this.oneTimeProfileChangeListener);
        const listener = (changedType, newTypeValue) => {
            this.unbindOneTimeProfileChangeListener();
            cb(changedType, newTypeValue);
        };
        this.oneTimeProfileChangeListener = listener;
        Web3Service.bindProfileChange(this.oneTimeProfileChangeListener);
    }

    unbindOneTimeProfileChangeListener() {
        if (this.oneTimeProfileChangeListener) {
            Web3Service.unbindProfileChange(this.oneTimeProfileChangeListener);
            this.oneTimeProfileChangeListener = null;
        }
    }

    addEnableListener(options, listener) {
        const optionsKey = JSON.stringify(options);
        if (!this.enableListenersMapping[optionsKey]) {
            this.enableListenersMapping[optionsKey] = [];
        }

        this.enableListenersMapping[optionsKey].push(listener);
    }

    flushEnableListeners(options) {
        const optionsKey = JSON.stringify(options);
        const callbacks = this.enableListenersMapping[optionsKey] || [];

        delete this.enableListenersMapping[optionsKey];

        callbacks.forEach((cb) => {
            cb(this.aztecAccount, this.error);
        });
    }

    handleResolveSession = (
        options,
        {
            aztecAccount = null,
            error = null,
        },
    ) => {
        this.aztecAccount = aztecAccount;
        this.error = error;
        this.eventListeners.notify(
            'profileChanged',
            'aztecAccountChanged',
            aztecAccount,
            error,
        );
        this.flushEnableListeners(options);
    };

    enable = async (
        options = {},
        callback = null,
    ) => {
        if (!isEqual(options, this.currentOptions)) {
            this.flushEnableListeners(this.currentOptions);
            this.currentOptions = options;
        } else if (!this.error) {
            if (callback) {
                if (this.sessionPromise) {
                    this.addEnableListener(options, callback);
                } else {
                    callback(this.aztecAccount, this.error);
                }
            }
            return this.sessionPromise || this.aztecAccount;
        }

        if (callback) {
            this.addEnableListener(options, callback);
        }

        this.sessionPromise = new Promise((resolve, reject) => {
            this.addEnableListener(options, (aztecAccount, error) => {
                this.sessionPromise = null;
                if (error) {
                    reject(error);
                } else {
                    resolve(aztecAccount);
                }
            });
        });

        this.refreshSession(options);

        return this.sessionPromise;
    };

    async disable(options = this.currentOptions) {
        this.flushEnableListeners(options);
        this.currentOptions = null;
        this.aztecAccount = null;
        this.error = null;
        this.unbindOneTimeProfileChangeListener();
        await this.generateDefaultApis();
        await ConnectionService.disconnect();
    }

    async refreshSession(options) {
        this.aztecAccount = null;
        this.error = null;
        await this.generateDefaultApis();
        await ConnectionService.disconnect();

        let networkSwitchedDuringStart = false;

        this.bindOneTimeProfileChangeListener(() => {
            networkSwitchedDuringStart = true;
            if (this.autoRefreshOnProfileChange) {
                this.refreshSession(options);
            }
        });

        const {
            apiKey = '',
            providerUrl = '',
            contractAddresses = {
                ACE: '',
                AccountRegistry: '',
                AccountRegistryManager: '',
            },
        } = options;

        const tasks = [
            async () => ConnectionService.openConnection({
                apiKey,
                providerUrl,
                contractAddresses,
            }),
            ({
                error,
                ...networkConfig
            }) => {
                if (error) {
                    throw error;
                }
                ApiPermissionService.validateContractConfigs(networkConfig);
                return networkConfig;
            },
            async networkConfig => Web3Service.init(networkConfig),
            async () => {
                const {
                    account: aztecAccount,
                } = await ApiPermissionService.ensurePermission() || {};
                return aztecAccount;
            },
            async (aztecAccount) => {
                const apis = await ApiPermissionService.generateApis(true);
                this.setApis(apis);

                if (this.autoRefreshOnProfileChange) {
                    this.bindOneTimeProfileChangeListener(() => {
                        this.refreshSession(options);
                    });
                }

                this.handleResolveSession(options, {
                    aztecAccount,
                });
            },
        ];

        try {
            let prevResult;
            await asyncForEach(tasks, async (task) => {
                if (networkSwitchedDuringStart
                    || !isEqual(options, this.currentOptions)
                ) {
                    return;
                }

                prevResult = await task(prevResult);
            });
        } catch (error) {
            if (!networkSwitchedDuringStart
                && isEqual(options, this.currentOptions)
            ) {
                this.handleResolveSession(options, {
                    error,
                });
            }
        }
    }
}
