import * as aztec from 'aztec.js';
import {
    warnLog,
} from '~/utils/log';
import ApiManager from './ApiManager';

let manager;

class Aztec {
    constructor() {
        manager = new ApiManager();

        const apis = manager.generateDefaultApis();
        Object.keys(apis).forEach((apiName) => {
            this[apiName] = apis[apiName];
        });

        Object.keys(aztec).forEach((name) => {
            if (this[name]) {
                warnLog(`Api '${name}' is already in Aztec.`);
                return;
            }
            this[name] = aztec[name];
        });
    }

    get enabled() { // eslint-disable-line class-methods-use-this
        return !!manager.enabledOptions;
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
            this[apiName] = apis[apiName];
        });
    });

    disable = async () => manager.disable((apis) => {
        Object.keys(apis).forEach((apiName) => {
            this[apiName] = apis[apiName];
        });
    });
}

export default Aztec;
