import NotesSyncManager from './index';


class NotesSyncManagerFactory {
    managersByNetworks = {};

    config = {
        blocksPerRequest: 100, // ~ per 3 months (~6000 per day)
        precisionDelta: 10, //
        networkId: null,
    };

    ensureManager = (networkId) => {
        if (this.managersByNetworks[networkId]) {
            return;
        }
        const manager = new NotesSyncManager();
        manager.setConfig({
            ...this.config,
            networkId,
        });
        this.managersByNetworks[networkId] = manager;
    };

    create(networkId) {
        this.ensureManager(networkId);
        return this.managersByNetworks[networkId];
    }
}

export default new NotesSyncManagerFactory();
