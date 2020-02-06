import * as aztec from 'aztec.js';
import {
    warnLog,
} from '~/utils/log';
import ApiManager from './ApiManager';

const manager = new ApiManager();

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

    addListener(eventName, callback) { // eslint-disable-line class-methods-use-this
        manager.eventListeners.add(eventName, callback);
    }

    removeListener(eventName, callback) { // eslint-disable-line class-methods-use-this
        manager.eventListeners.remove(eventName, callback);
    }

    enable = async (
        options = {},
        callback = null,
    ) => manager.enable(options, callback, (apis) => {
        Object.keys(apis).forEach((apiName) => {
            if (this[apiName] && apis[apiName]) {
                warnLog(`Api '${apiName}' is already in Aztec.`);
                return;
            }
            this[apiName] = apis[apiName];
        });
    });

    disable = async () => {
        Object.keys(manager.apis).forEach((apiName) => {
            this[apiName] = null;
        });
        return manager.disable();
    }
}

export default Aztec;
