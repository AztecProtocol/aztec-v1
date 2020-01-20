import NotesWatcher from './index';


class NotesWatcherFactory {
    watchersByNetworks = {};

    config = {};

    ensureWatcher = (networkId) => {
        if (this.watchersByNetworks[networkId]) {
            return;
        }
        const manager = new NotesWatcher({
            ...this.config,
            networkId,
        });
        this.watchersByNetworks[networkId] = manager;
    };

    create(networkId) {
        this.ensureWatcher(networkId);
        return this.watchersByNetworks[networkId];
    }
}

export default new NotesWatcherFactory();
