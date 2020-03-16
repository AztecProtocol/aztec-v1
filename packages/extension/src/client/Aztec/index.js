import * as aztec from 'aztec.js';
import {
    warnLog,
} from '~/utils/log';
import ApiManager from './ApiManager';

let manager;

class Aztec {
    constructor() {
        manager = new ApiManager();

        manager.setApis = (apis) => {
            Object.keys(apis).forEach((apiName) => {
                this[apiName] = apis[apiName];
            });
        };

        Object.keys(aztec).forEach((name) => {
            if (this[name]) {
                warnLog(`Api '${name}' is already in Aztec.`);
                return;
            }
            this[name] = aztec[name];
        });
    }

    async generateInitialApis() { // eslint-disable-line class-methods-use-this
        await manager.generateDefaultApis();
    }

    get enabled() { // eslint-disable-line class-methods-use-this
        return !!manager.aztecAccount;
    }

    get account() { // eslint-disable-line class-methods-use-this
        return manager.aztecAccount;
    }

    get autoRefreshOnProfileChange() { // eslint-disable-line class-methods-use-this
        return manager.autoRefreshOnProfileChange;
    }

    set autoRefreshOnProfileChange(autoRefresh) { // eslint-disable-line class-methods-use-this
        manager.autoRefreshOnProfileChange = autoRefresh;
    }

    addListener(eventName, callback) { // eslint-disable-line class-methods-use-this
        manager.eventListeners.add(eventName, callback);
    }

    removeListener(eventName, callback) { // eslint-disable-line class-methods-use-this
        manager.eventListeners.remove(eventName, callback);
    }

    enable = async (
        options = {},
        callback = null,
    ) => manager.enable(options, callback);

    disable = async () => manager.disable();
}

export default Aztec;
