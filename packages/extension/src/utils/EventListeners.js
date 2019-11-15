import {
    warnLog,
} from '~utils/log';

export default class EventListeners {
    constructor(eventNames) {
        this.eventNames = eventNames;
        this.eventListeners = {};
        eventNames.forEach((name) => {
            this.eventListeners[name] = [];
        });
    }

    add = (eventName, cb) => {
        if (!this.eventListeners[eventName]) {
            const events = Object.keys(this.eventListeners)
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call EventListeners.add('${eventName}').`,
                `Available events: [${events}].`,
            );
            return;
        }

        this.eventListeners[eventName].push(cb);
    };

    remove = (eventName, cb) => {
        if (!this.eventListeners[eventName]) {
            const events = Object.keys(this.eventListeners)
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call EventListeners.remove('${eventName}').`,
                `Available events: [${events}].`,
            );
            return;
        }

        const toRemove = this.eventListeners[eventName]
            .findIndex(listener => listener === cb);
        if (toRemove >= 0) {
            this.eventListeners[eventName].splice(toRemove, 1);
        }
    };

    notify = (eventName, params) => {
        const listeners = this.eventListeners[eventName];
        listeners.forEach(cb => cb(params));
    };

    isListening = (eventName, cb) => this.eventListeners[eventName]
        .some(callback => callback === cb);
}
