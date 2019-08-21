import {
    warnLog,
    errorLog,
} from '~utils/log';
import fetchRegisterExtensions from '../utils/fetchRegisterExtensions'
import addRegisterExtension from '../utils/addRegisterExtension';

class SyncManager {
    constructor() {
        this.config = {
            syncInterval: 5000, // ms
        };
        this.addresses = new Map();
        this.paused = false;
    }

    setConfig(config) {
        Object.keys(this.config)
            .forEach((key) => {
                if (config[key] !== undefined) {
                    this.config[key] = config[key];
                }
            });
    }

    isInQueue(address) {
        const syncAddress = this.addresses.get(address);
        return !!(syncAddress
            && (syncAddress.syncing || syncAddress.syncReq)
        );
    }

    handleFetchError = (error) => {
        errorLog('Failed to sync RegisterExtension with web3.', error);
        if (process.env.NODE_ENV === 'development') {
            this.paused = true;
        }
    };

    pause = (address, prevState = {}) => {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`RegisterExtension syncing with "${address}" eth address is not in process.`);
            return;
        }

        this.addresses.set(address, {
            ...syncAddress,
            pausedState: prevState,
        });
    };

    resume = (address) => {
        const syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            warnLog(`RegisterExtension syncing with "${address}" eth address is not in process.`);
            return;
        }

        const {
            pausedState,
        } = syncAddress;
        if (!pausedState) {
            warnLog(`RegisterExtension with ${address} eth address is already running.`);
            return;
        }

        this.addresses.set(address, {
            ...syncAddress,
            pausedState: null,
        });

        this.syncRegisterExtensions({
            ...pausedState,
            address,
        });
    };

    async syncRegisterExtensions(options) {
        const {
            address,
            lastSyncedBlock,
        } = options;

        const syncAddress = this.addresses.get(address);
        if (syncAddress.pausedState) {
            return;
        }
        if (this.paused) {
            this.pause(address, options);
            return;
        }

        this.addresses.set(address, {
            ...syncAddress,
            syncing: true,
            syncReq: null,
        });

        const {
            syncReq: prevSyncReq,
        } = syncAddress;

        if (prevSyncReq) {
            clearTimeout(prevSyncReq);
        }

        const {
            syncInterval,
        } = this.config;

        const newRegisterExtensions = await fetchRegisterExtensions({
            address,
            lastSyncedBlock,
            onError: this.handleFetchError,
        });

        console.log("Response for events 'registerExtensions': " + JSON.stringify({address, lastSyncedBlock, newRegisterExtensions}))

        if (newRegisterExtensions && newRegisterExtensions.length) {
            const lastRegisterExtension = newRegisterExtensions[newRegisterExtensions.length - 1];
            await addRegisterExtension(lastRegisterExtension);
        }

        const syncReq = setTimeout(() => {
            this.syncRegisterExtensions({
                ...options,
                lastSyncedBlock: lastSyncedBlock + 1,
            });
        }, syncInterval);

        this.addresses.set(address, {
            ...syncAddress,
            syncing: false,
            syncReq,
            lastSyncedBlock,
        });
    }

    async sync({
        address,
        lastSyncedBlock,
    }) {
        let syncAddress = this.addresses.get(address);
        if (!syncAddress) {
            syncAddress = {
                syncing: false,
                syncReq: null,
                lastSyncedBlock,
            };
            this.addresses.set(address, syncAddress);
        }
        return this.syncRegisterExtensions({
            address,
            lastSyncedBlock,
        });
    }
}

export default SyncManager;
