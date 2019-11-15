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

    addListener = (eventName, cb) => {
        if (!this.eventListeners[eventName]) {
            const events = Object.keys(this.eventListeners)
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call RawNoteManager.addListener('${eventName}').`,
                `Available events: [${events}].`,
            );
            return;
        }

        this.eventListeners[eventName].push(cb);
    };

    removeListener = (eventName, cb) => {
        if (!this.eventListeners[eventName]) {
            const events = Object.keys(this.eventListeners)
                .map(name => `'${name}'`)
                .join(', ');
            warnLog(
                `Cannot call RawNoteManager.removeListener('${eventName}').`,
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

    notifyListeners = (eventName, params) => {
        const listeners = this.eventListeners[eventName];
        listeners.forEach(cb => cb(params));
    };
}
