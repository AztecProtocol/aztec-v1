import {
    warnLog,
} from '~/utils/log';

export default class EventListeners {
    constructor(eventNames) {
        this.eventNames = eventNames;
        this.eventListeners = {};
        eventNames.forEach((name) => {
            this.eventListeners[name] = [];
        });
    }

    validateEventName(eventName, api) {
        if (!this.eventListeners[eventName]) {
            const events = this.eventNames
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call EventListeners.${api}('${eventName}').`,
                `Available events: [${events}].`,
            );
            return false;
        }
        return true;
    }

    add = (eventName, cb) => {
        if (!this.validateEventName(eventName, 'add')
            || this.isListening(eventName, cb)
        ) return;

        this.eventListeners[eventName].push(cb);
    };

    remove = (eventName, cb) => {
        if (!this.validateEventName(eventName, 'remove')) return;

        const toRemove = this.eventListeners[eventName]
            .findIndex(listener => listener === cb);
        if (toRemove >= 0) {
            this.eventListeners[eventName].splice(toRemove, 1);
        }
    };

    removeAll = (eventName) => {
        if (!this.validateEventName(eventName, 'removeAll')) return;

        this.eventListeners[eventName] = [];
    };

    notify = (eventName, ...params) => {
        const listeners = this.eventListeners[eventName];
        listeners.forEach(cb => cb(...params));
    };

    isListening = (eventName, cb) => this.eventListeners[eventName]
        .some(callback => callback === cb);
}
