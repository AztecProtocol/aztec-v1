import NotesSyncManager from './';


class NotesSyncManagerFactory {

    _managersByNetworks = {};

    _ensureManager = (networkId) => {
        if (this._managersByNetworks[networkId]) {
            return;
        }
        this._managersByNetworks[networkId] = new NotesSyncManager();
    };

    create(networkId) {
        this._ensureManager(networkId);
        return this._managersByNetworks[networkId];
    }

}

export default new NotesSyncManagerFactory();